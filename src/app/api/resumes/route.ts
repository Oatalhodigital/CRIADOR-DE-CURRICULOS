import { NextRequest, NextResponse } from 'next/server';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
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

    const { searchParams } = new URL(request.url);
    const rawLimit = parseInt(searchParams.get('limit') || '50', 10);
    const limit = Math.min(Math.max(rawLimit || 50, 1), 200);
    const pageLimit = limit + 1; // fetch one extra to detect hasMore
    const cursorUpdatedAt = searchParams.get('cursorUpdatedAt');
    const cursorId = searchParams.get('cursorId');

    let query: FirebaseFirestore.Query = adminDb
      .collection('resumes')
      .orderBy('updatedAt', 'desc')
      .orderBy('__name__', 'desc');

    if (cursorUpdatedAt && cursorId) {
      try {
        const cursorTs = Timestamp.fromDate(new Date(cursorUpdatedAt));
        query = query.startAfter(cursorTs, cursorId);
      } catch (err) {
        console.warn('[api/resumes] invalid cursor', { cursorUpdatedAt, cursorId });
      }
    }

    query = query.limit(pageLimit);

    const snapshot = await withTimeout(query.get(), 10000, 'resume list');

    const allDocs = snapshot.docs.map((d) => {
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

    const hasMore = allDocs.length > limit;
    const resumes = hasMore ? allDocs.slice(0, limit) : allDocs;
    const lastDoc = snapshot.docs[resumes.length - 1];

    const nextCursor = hasMore && lastDoc
      ? {
          updatedAt: lastDoc.data().updatedAt?.toDate?.()?.toISOString() || '',
          id: lastDoc.id,
        }
      : null;

    const totalRevenue = resumes.filter((r) => r.paid).length * 10;
    const totalResumes = resumes.length;
    const paidCount = resumes.filter((r) => r.paid).length;
    const conversionRate = totalResumes > 0 ? ((paidCount / totalResumes) * 100).toFixed(1) : '0';

    console.log('[api/resumes] listed', { count: resumes.length, hasMore, durationMs: Date.now() - start });
    return NextResponse.json({
      resumes,
      stats: {
        totalResumes,
        totalRevenue,
        paidCount,
        conversionRate,
      },
      hasMore,
      nextCursor,
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