import { NextRequest, NextResponse } from 'next/server';
import { getOrderByMpPaymentId, recordDownload } from '@/lib/postgres';
import { adminDb } from '@/lib/firebase-admin';
import { generateResumePdfBuffer } from '@/lib/pdf';
import { Resume } from '@/types/resume';

async function getResumeFromOrder(order: any): Promise<Resume | null> {
  if (order?.resume_snapshot) return order.resume_snapshot as Resume;
  const resumeId = order?.resume_firestore_id || order?.lead_firestore_id;
  if (!resumeId || !adminDb) return null;
  try {
    const doc = await adminDb.collection('resumes').doc(resumeId).get();
    return (doc.data() as Resume) || null;
  } catch (err) {
    console.error('[api/download] fetch resume failed', err);
    return null;
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'ID do pagamento é obrigatório.' }, { status: 400 });
    }

    const order = await getOrderByMpPaymentId(id);

    if (!order) {
      return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 });
    }

    if (order.status !== 'approved') {
      return NextResponse.json({ error: 'Pagamento ainda não aprovado.' }, { status: 402 });
    }

    if (order.downloads_used >= order.downloads_allowed) {
      return NextResponse.json({ error: 'Limite de downloads atingido.' }, { status: 403 });
    }

    const resume = await getResumeFromOrder(order);
    if (!resume) {
      return NextResponse.json({ error: 'Currículo não encontrado para este pagamento.' }, { status: 404 });
    }

    const buffer = await generateResumePdfBuffer(resume);

    const updated = await recordDownload(id);
    if (!updated) {
      return NextResponse.json({ error: 'Limite de downloads atingido.' }, { status: 403 });
    }

    return new NextResponse(buffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="curriculo.pdf"',
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (err) {
    console.error('[api/download] error', err);
    return NextResponse.json({ error: 'Falha ao gerar PDF.' }, { status: 500 });
  }
}
