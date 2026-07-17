import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';

const withTimeout = <T,>(promise: Promise<T>, ms = 6000, label = 'operation'): Promise<T> =>
  Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timeout`)), ms)
    ),
  ]);

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

    let body: any;
    try {
      body = await request.json();
    } catch (parseErr) {
      console.error('[api/leads] JSON inválido', parseErr);
      return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 });
    }

    const { name, email, whatsapp, consentMarketing } = body || {};

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