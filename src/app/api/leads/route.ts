import { NextRequest, NextResponse } from 'next/server';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const withTimeout = <T,>(promise: Promise<T>, ms = 8000, label = 'operation'): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timeout`)), ms)
    ),
  ]);
};

export async function POST(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: 'Firebase não configurado. Verifique as variáveis de ambiente.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { name, email, whatsapp, consentMarketing } = body;

    if (!name || !email || !whatsapp) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const leadId = `lead-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    await withTimeout(
      setDoc(doc(db, 'leads', leadId), {
        name,
        email,
        whatsapp,
        consentMarketing: consentMarketing || false,
        status: 'new',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
      8000,
      'save lead'
    );

    return NextResponse.json(
      { success: true, leadId },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error saving lead:', error);
    const status = error?.message?.includes('timeout') ? 504 : 500;
    return NextResponse.json(
      { error: error?.message?.includes('timeout') ? 'Tempo esgotado ao salvar lead.' : 'Failed to save lead data' },
      { status }
    );
  }
}
