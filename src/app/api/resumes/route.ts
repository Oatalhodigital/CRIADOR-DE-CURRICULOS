import { NextRequest, NextResponse } from 'next/server';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  if (!isFirebaseConfigured()) {
    return NextResponse.json(
      { error: 'Firebase não configurado.' },
      { status: 503 }
    );
  }

  try {
    const resume = await request.json();

    if (!resume?.personalInfo?.email) {
      return NextResponse.json({ error: 'E-mail é obrigatório.' }, { status: 400 });
    }

    const id = resume.id || doc(collection(db, 'resumes')).id;
    const docRef = doc(db, 'resumes', id);

    await setDoc(
      docRef,
      {
        ...resume,
        id,
        updatedAt: serverTimestamp(),
        createdAt: resume.createdAt || serverTimestamp(),
      },
      { merge: true }
    );

    return NextResponse.json({ id });
  } catch (error) {
    console.error('Resume save error:', error);
    return NextResponse.json(
      { error: 'Falha ao salvar currículo.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const adminEmail = process.env.ADMIN_EMAIL;
  const requestEmail = request.headers.get('x-admin-email');

  if (!adminEmail || requestEmail !== adminEmail) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  if (!isFirebaseConfigured()) {
    return NextResponse.json(
      { error: 'Firebase não configurado.' },
      { status: 503 }
    );
  }

  try {
    const q = query(
      collection(db, 'resumes'),
      orderBy('updatedAt', 'desc'),
      limit(50)
    );
    const snapshot = await getDocs(q);

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

    return NextResponse.json({
      resumes,
      stats: {
        totalResumes,
        totalRevenue,
        paidCount,
        conversionRate,
      },
    });
  } catch (error) {
    console.error('Resume list error:', error);
    return NextResponse.json(
      { error: 'Falha ao listar currículos.' },
      { status: 500 }
    );
  }
}
