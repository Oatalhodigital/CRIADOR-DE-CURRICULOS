import { NextRequest, NextResponse } from 'next/server';
import { getOrderByMpPaymentId, recordDownload, markConfirmationEmailSent } from '@/lib/postgres';
import { adminDb } from '@/lib/firebase-admin';
import { generateResumePdfBuffer } from '@/lib/pdf';
import { sendPaymentConfirmationEmail, getAppUrl } from '@/lib/email';
import { Resume } from '@/types/resume';

export const maxDuration = 60;

function isBrowserNavigation(request: NextRequest): boolean {
  const secFetchDest = request.headers.get('sec-fetch-dest');
  if (secFetchDest) {
    return secFetchDest === 'document' || secFetchDest === 'iframe' || secFetchDest === 'embed';
  }
  const accept = request.headers.get('accept') || '';
  return accept.includes('text/html') && !accept.includes('application/json');
}

function htmlErrorResponse(title: string, message: string, request: NextRequest) {
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
  body { font-family: -apple-system, system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f9fafb; color: #111827; }
  .card { max-width: 420px; padding: 2rem; text-align: center; }
  .icon { font-size: 3rem; margin-bottom: 1rem; }
  h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
  p { color: #6b7280; font-size: 0.95rem; line-height: 1.5; }
  a { display: inline-block; margin-top: 1.5rem; color: #059669; font-weight: 600; text-decoration: none; }
</style>
</head>
<body>
  <div class="card">
    <div class="icon">📄</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="/">Voltar ao início</a>
  </div>
</body>
</html>`;
  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
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
      if (isBrowserNavigation(request)) return htmlErrorResponse('Download indisponível', 'O link de download não contém um identificador válido. Verifique o link recebido por e-mail ou acesse sua conta.', request);
      return NextResponse.json({ error: 'ID do pagamento é obrigatório.' }, { status: 400 });
    }

    const order = await getOrderByMpPaymentId(id);

    if (!order) {
      if (isBrowserNavigation(request)) return htmlErrorResponse('Pedido não encontrado', 'Não encontramos um pedido associado a este link. O pagamento pode ainda estar sendo processado — tente novamente em alguns instantes.', request);
      return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 });
    }

    if (order.status !== 'approved') {
      if (isBrowserNavigation(request)) return htmlErrorResponse('Pagamento pendente', 'Seu pagamento ainda não foi confirmado. Aguarde alguns instantes e tente novamente.', request);
      return NextResponse.json({ error: 'Pagamento ainda não aprovado.' }, { status: 402 });
    }

    if (order.downloads_used >= order.downloads_allowed) {
      if (isBrowserNavigation(request)) return htmlErrorResponse('Limite de downloads atingido', 'Você já baixou seu currículo o número máximo de vezes. Verifique seu e-mail — o PDF foi enviado por lá também.', request);
      return NextResponse.json({ error: 'Limite de downloads atingido.' }, { status: 403 });
    }

    const resume = await getResumeFromOrder(order);
    if (!resume) {
      if (isBrowserNavigation(request)) return htmlErrorResponse('Currículo não encontrado', 'Não conseguimos localizar os dados do seu currículo. Entre em contato com o suporte se o problema persistir.', request);
      return NextResponse.json({ error: 'Currículo não encontrado para este pagamento.' }, { status: 404 });
    }

    const buffer = await generateResumePdfBuffer(resume);

    const updated = await recordDownload(id);
    if (!updated) {
      if (isBrowserNavigation(request)) return htmlErrorResponse('Limite de downloads atingido', 'Você já baixou seu currículo o número máximo de vezes. Verifique seu e-mail — o PDF foi enviado por lá também.', request);
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

    // Detecta se a requisição vem de navegação direta (iframe/in-app)
    // para usar Content-Disposition inline em vez de attachment,
    // permitindo visualização do PDF dentro do navegador in-app.
    const secFetchDest = request.headers.get('sec-fetch-dest');
    const userAgent = request.headers.get('user-agent') || '';
    const isInAppBrowser = /Instagram|FBAN|FBAV|Messenger|TikTok|LinkedInApp|Pinterest|Snapchat/i.test(userAgent);
    const isIframe = secFetchDest === 'iframe' || secFetchDest === 'embed';
    const useInline = isIframe || isInAppBrowser;

    return new NextResponse(buffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': useInline
          ? 'inline; filename="curriculo.pdf"'
          : 'attachment; filename="curriculo.pdf"',
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
    if (isBrowserNavigation(request)) return htmlErrorResponse('Erro ao gerar PDF', 'Ocorreu um erro ao gerar seu currículo. Tente novamente em alguns instantes. Se o problema persistir, verifique seu e-mail — o PDF foi enviado por lá.', request);
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
