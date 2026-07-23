import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { insertLeadPostgres, insertFunnelEventPostgres } from '@/lib/postgres';

const withTimeout = <T,>(promise: Promise<T>, ms = 6000, label = 'operation'): Promise<T> =>
  Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timeout`)), ms)
    ),
  ]);

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 20; // 20 requisições por minuto por IP
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minuto

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  return forwarded?.split(',')[0].trim() || realIp || 'unknown';
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (record.count >= RATE_LIMIT) return false;
  record.count++;
  return true;
}

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
    if (!checkRateLimit(clientIp)) {
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

    // Analytics complementar em Postgres (não bloqueia o fluxo principal)
    try {
      insertLeadPostgres({
        firestore_id: leadId,
        name,
        email,
        whatsapp,
        consent_marketing: consentMarketing || false,
        utm_source: utm_source || null,
        utm_medium: utm_medium || null,
        utm_campaign: utm_campaign || null,
      });
      insertFunnelEventPostgres({
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