import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';

const withTimeout = <T,>(promise: Promise<T>, ms = 10000, label = 'firestore'): Promise<T> =>
  Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timeout`)), ms)
    ),
  ]);

export async function POST(request: NextRequest) {
  const start = Date.now();
  console.log('[api/resumes] start', { timestamp: new Date().toISOString() });

  try {
    if (!adminDb) {
      console.error('[api/resumes] Firebase Admin SDK não configurado');
      return NextResponse.json(
        { error: 'Firebase não configurado no servidor.' },
        { status: 503 }
      );
    }

    const resume = await request.json();

    if (!resume?.personalInfo?.email) {
      return NextResponse.json({ error: 'E-mail é obrigatório.' }, { status: 400 });
    }

    const id = resume.id || adminDb.collection('resumes').doc().id;
    const docRef = adminDb.collection('resumes').doc(id);

    await withTimeout(
      docRef.set(
        {
          ...resume,
          id,
          updatedAt: FieldValue.serverTimestamp(),
          createdAt: resume.createdAt || FieldValue.serverTimestamp(),
        },
        { merge: true }
      ),
      10000,
      'resume save'
    );

    console.log('[api/resumes] saved', { id, durationMs: Date.now() - start });
    return NextResponse.json({ id });
  } catch (error: any) {
    console.error('[api/resumes] error', {
      error: error?.message || String(error),
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - start,
    });
    const status = error?.message?.includes('timeout') ? 504 : 500;
    return NextResponse.json(
      { error: error?.message?.includes('timeout') ? 'Tempo esgotado ao salvar currículo.' : 'Falha ao salvar currículo.' },
      { status }
    );
  }
}

export async function GET(request: NextRequest) {
  const start = Date.now();
  console.log('[api/resumes] GET start', { timestamp: new Date().toISOString() });

  const adminEmail = process.env.ADMIN_EMAIL;
  const requestEmail = request.headers.get('x-admin-email');

  if (!adminEmail || requestEmail !== adminEmail) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  try {
    if (!adminDb) {
      console.error('[api/resumes] Firebase Admin SDK não configurado');
      return NextResponse.json(
        { error: 'Firebase não configurado no servidor.' },
        { status: 503 }
      );
    }

    const snapshot = await withTimeout(
      adminDb.collection('resumes').orderBy('updatedAt', 'desc').limit(50).get(),
      10000,
      'resume list'
    );

    const resumes = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        fullName: data.personalInfo?.fullName || '',
        email: data.personalInfo?.email || '',
        paid: data.paid || false,
        paymentId: data.paymentId || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
      };
    });

    const totalRevenue = resumes.filter((r) => r.paid).length * 10;
    const totalResumes = resumes.length;
    const paidCount = resumes.filter((r) => r.paid).length;
    const conversionRate = totalResumes > 0 ? ((paidCount / totalResumes) * 100).toFixed(1) : '0';

    console.log('[api/resumes] listed', { count: resumes.length, durationMs: Date.now() - start });
    return NextResponse.json({
      resumes,
      stats: {
        totalResumes,
        totalRevenue,
        paidCount,
        conversionRate,
      },
    });
  } catch (error: any) {
    console.error('[api/resumes] GET error', {
      error: error?.message || String(error),
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - start,
    });
    const status = error?.message?.includes('timeout') ? 504 : 500;
    return NextResponse.json(
      { error: error?.message?.includes('timeout') ? 'Tempo esgotado ao listar currículos.' : 'Falha ao listar currículos.' },
      { status }
    );
  }
}