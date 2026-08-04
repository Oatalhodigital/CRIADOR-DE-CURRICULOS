import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { insertLeadPostgres, insertFunnelEventPostgres } from '@/lib/postgres';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

const withTimeout = <T,>(promise: Promise<T>, ms = 6000, label = 'operation'): Promise<T> =>
  Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timeout`)), ms)
    ),
  ]);

const RATE_LIMIT = 20; // 20 requisições por minuto por IP
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minuto

export async function POST(request: NextRequest) {
  const start = Date.now();
  console.log('[api/leads] start', { timestamp: new Date().toISOString() });

  try {
    if (!adminDb) {
      console.error('[api/leads] Firebase Admin SDK não configurado');
      return NextResponse.json(
        { error: 'Firebase não configurado no servidor.' },
        { status: 503 }
      );
    }

    const clientIp = getClientIp(request);
    if (!checkRateLimit(`leads:${clientIp}`, RATE_LIMIT, RATE_LIMIT_WINDOW)) {
      return NextResponse.json(
        { error: 'Muitas tentativas de cadastro. Aguarde um minuto.' },
        { status: 429 }
      );
    }

    let body: any;
    try {
      body = await request.json();
    } catch (parseErr) {
      console.error('[api/leads] JSON inválido', parseErr);
      return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 });
    }

    const { name, email, whatsapp, consentMarketing, utm_source, utm_medium, utm_campaign } = body || {};

    if (!name || !email || !whatsapp) {
      console.warn('[api/leads] campos obrigatórios ausentes', { body });
      return NextResponse.json(
        { error: 'Preencha nome, e-mail e WhatsApp.' },
        { status: 400 }
      );
    }

    const leadId = `lead-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    await withTimeout(
      adminDb.collection('leads').doc(leadId).set({
        name,
        email,
        whatsapp,
        consentMarketing: consentMarketing || false,
        status: 'new',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      }),
      6000,
      'save lead'
    );

    // Precisa ser aguardado: em serverless a execução é congelada assim que a
    // resposta é devolvida, e a escrita ficaria pela metade.
    try {
      await insertLeadPostgres({
        firestore_id: leadId,
        name,
        email,
        whatsapp,
        consent_marketing: consentMarketing || false,
        utm_source: utm_source || null,
        utm_medium: utm_medium || null,
        utm_campaign: utm_campaign || null,
      });
      await insertFunnelEventPostgres({
        lead_firestore_id: leadId,
        event_name: 'lead_captured',
      });
    } catch (postgresErr) {
      console.error('[api/leads] analytics write failed', postgresErr);
    }

    console.log('[api/leads] saved', { leadId, email, durationMs: Date.now() - start });
    return NextResponse.json({ success: true, leadId }, { status: 200 });
  } catch (error: any) {
    console.error('[api/leads] error', {
      error: error?.message || String(error),
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - start,
    });

    const isTimeout = error?.message?.includes('timeout');
    return NextResponse.json(
      { error: isTimeout ? 'Tempo esgotado ao salvar lead.' : 'Falha ao salvar lead.' },
      { status: isTimeout ? 504 : 500 }
    );
  }
}