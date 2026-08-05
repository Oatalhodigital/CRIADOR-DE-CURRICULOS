import { NextRequest, NextResponse } from 'next/server';
import { getOrderByMpPaymentId, recordDownload, markConfirmationEmailSent } from '@/lib/postgres';
import { adminDb } from '@/lib/firebase-admin';
import { generateResumePdfBuffer } from '@/lib/pdf';
import { sendPaymentConfirmationEmail, getAppUrl } from '@/lib/email';
import { Resume } from '@/types/resume';

function isBrowserNavigation(request: NextRequest): boolean {
  const secFetchDest = request.headers.get('sec-fetch-dest');
  if (secFetchDest) {
    return secFetchDest === 'document' || secFetchDest === 'iframe' || secFetchDest === 'embed';
  }
  const accept = request.headers.get('accept') || '';
  return accept.includes('text/html') && !accept.includes('application/json');
}

function getRedirectResponse(request: NextRequest, search = '') {
  const url = new URL('/', request.url);
  if (search) url.search = search;
  return NextResponse.redirect(url);
}

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
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let id: string | undefined;
  try {
    ({ id } = await params);

    if (!id) {
      if (isBrowserNavigation(request)) return getRedirectResponse(request);
      return NextResponse.json({ error: 'ID do pagamento é obrigatório.' }, { status: 400 });
    }

    const order = await getOrderByMpPaymentId(id);

    if (!order) {
      if (isBrowserNavigation(request)) return getRedirectResponse(request);
      return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 });
    }

    if (order.status !== 'approved') {
      if (isBrowserNavigation(request)) return getRedirectResponse(request);
      return NextResponse.json({ error: 'Pagamento ainda não aprovado.' }, { status: 402 });
    }

    if (order.downloads_used >= order.downloads_allowed) {
      if (isBrowserNavigation(request)) return getRedirectResponse(request, 'error=download_limit');
      return NextResponse.json({ error: 'Limite de downloads atingido.' }, { status: 403 });
    }

    const resume = await getResumeFromOrder(order);
    if (!resume) {
      if (isBrowserNavigation(request)) return getRedirectResponse(request);
      return NextResponse.json({ error: 'Currículo não encontrado para este pagamento.' }, { status: 404 });
    }

    const buffer = await generateResumePdfBuffer(resume);

    const updated = await recordDownload(id);
    if (!updated) {
      if (isBrowserNavigation(request)) return getRedirectResponse(request, 'error=download_limit');
      return NextResponse.json({ error: 'Limite de downloads atingido.' }, { status: 403 });
    }

    // Envia e-mail de agradecimento no primeiro download bem-sucedido
    if (updated.downloads_used === 1 && !order.confirmation_email_sent_at) {
      try {
        const payerEmail = order.payer_email || resume.personalInfo?.email || null;
        if (payerEmail) {
          const downloadUrl = `${getAppUrl()}/api/download/${id}`;
          const result = await sendPaymentConfirmationEmail({
            to: payerEmail,
            paymentId: id,
            plan: order.plan,
            downloadUrl,
          });
          await markConfirmationEmailSent(id, result.success);
        }
      } catch (emailErr) {
        console.error('[api/download] falha ao enviar e-mail de confirmação', emailErr);
      }
    }

    return new NextResponse(buffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="curriculo.pdf"',
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    const errorType = err instanceof Error ? err.name : 'unknown';
    console.error('[api/download] error', {
      id,
      error: errorMessage,
      type: errorType,
      timestamp: new Date().toISOString(),
    });
    if (isBrowserNavigation(request)) return getRedirectResponse(request);
    return NextResponse.json(
      {
        error: 'Falha ao gerar o PDF.',
        details: errorMessage,
        type: errorType,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
