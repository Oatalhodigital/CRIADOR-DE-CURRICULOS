import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// O Resend aceita anexos até cerca de 50 MB no e-mail todo; com overhead base64,
// mantemos margem de segurança para o PDF convertido em base64.
const MAX_ATTACHMENT_BYTES = 30 * 1024 * 1024;
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 500;

export function getFromEmail(): string {
  // O domínio resend.dev só pode enviar a partir de onboarding@resend.dev
  // sem verificação. Endereços genéricos como no-reply@resend.dev não
  // funcionam fora do sandbox, então fazemos fallback seguro aqui.
  const from = process.env.EMAIL_FROM?.trim();
  if (!from) return 'onboarding@resend.dev';
  if (from.includes('@resend.dev') && from !== 'onboarding@resend.dev' && !from.startsWith('onboarding@resend.dev')) {
    console.warn('[email] EMAIL_FROM aponta para resend.dev, mas não é onboarding@resend.dev; usando fallback', from);
    return 'onboarding@resend.dev';
  }
  return from;
}

export function getAppUrl(): string {
  // Domínio correto em punycode para currículorapidocomia.com.br.
  // O domínio sem acento (curriculorapidocomia.com.br) NUNCA teve DNS
  // configurado e quebra links/e-mails de download.
  const fallback = 'https://xn--currculorapidocomia-o1b.com.br';
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!envUrl) {
    console.warn('[getAppUrl] NEXT_PUBLIC_APP_URL não configurado; usando fallback', fallback);
  } else if (envUrl.includes('curriculorapidocomia.com.br') && !envUrl.includes('xn--')) {
    console.error(
      '[getAppUrl] NEXT_PUBLIC_APP_URL parece usar o domínio sem acento; corrija para',
      fallback
    );
  }
  return envUrl || fallback;
}

type SendEmailOptions = {
  to: string;
  paymentId: string;
  plan: string;
  downloadUrl: string;
  pdfBuffer?: Buffer | null;
};

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sendEmailWithRetry(payload: {
  from: string;
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: Buffer }[];
}): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!resend) {
    console.error('[email] RESEND_API_KEY not configured');
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  let lastError: string | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await resend.emails.send(payload);
      // A SDK do Resend pode retornar { error } sem lançar exceção.
      const resendError = (result as any)?.error;
      if (resendError) {
        const message = typeof resendError === 'string' ? resendError : resendError.message || JSON.stringify(resendError);
        lastError = message;
        console.error(`[email] attempt ${attempt}/${MAX_RETRIES} failed (Resend error)`, {
          error: message,
          to: payload.to?.replace(/@.*$/, '@...'),
          from: payload.from,
        });
        if (attempt < MAX_RETRIES) {
          await delay(INITIAL_RETRY_DELAY_MS * 2 ** (attempt - 1));
          continue;
        }
        break;
      }
      const resendId = (result?.data as { id?: string } | null)?.id || null;
      console.log('[email] sent successfully', {
        to: payload.to?.replace(/@.*$/, '@...'),
        attempt,
        resendId,
        from: payload.from,
        hasAttachment: !!payload.attachments?.length,
      });
      return { success: true, data: result };
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'Erro desconhecido ao enviar e-mail';
      console.error(`[email] attempt ${attempt}/${MAX_RETRIES} failed`, { error: lastError, to: payload.to?.replace(/@.*$/, '@...'), from: payload.from });
      if (attempt < MAX_RETRIES) {
        await delay(INITIAL_RETRY_DELAY_MS * 2 ** (attempt - 1));
      }
    }
  }

  return { success: false, error: lastError || 'Falha ao enviar e-mail após retries' };
}

export async function sendPaymentConfirmationEmail({
  to,
  paymentId,
  plan,
  downloadUrl,
  pdfBuffer,
}: SendEmailOptions) {
  const planLabels: Record<string, string> = {
    single: 'Básico',
    weekly: 'Intermediário',
    monthly: 'Completo',
  };

  const planLabel = planLabels[plan] || plan || 'Escolhido';
  const hasAttachment = Boolean(pdfBuffer && pdfBuffer.length > 0 && pdfBuffer.length <= MAX_ATTACHMENT_BYTES);
  const attachmentNote = hasAttachment
    ? '<p>O PDF do seu currículo está em anexo. Guarde-o com segurança.</p>'
    : '<p>O PDF está pronto para download pelo link seguro abaixo.</p>';

  const attachments = hasAttachment
    ? [
        {
          filename: 'curriculo.pdf',
          content: pdfBuffer as Buffer,
        },
      ]
    : undefined;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #059669;">Pagamento aprovado!</h2>
      <p>Olá,</p>
      <p>Recebemos a confirmação do seu pagamento (<strong>#${paymentId}</strong>) referente ao plano <strong>${planLabel}</strong>.</p>
      ${attachmentNote}
      <p style="margin: 24px 0;">
        <a href="${downloadUrl}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Baixar currículo em PDF</a>
      </p>
      ${!hasAttachment ? `<p>Caso o botão não funcione, copie e cole o link no navegador:</p><p style="word-break: break-all; color: #374151;">${downloadUrl}</p>` : ''}
      <p style="font-size: 12px; color: #6b7280;">
        Em caso de qualquer dificuldade, responda este e-mail. Agradecemos a confiança!<br/>
        Gostou do resultado? Indique para um amigo ou deixe uma avaliação — nos ajuda muito.<br/>
        LS Soluções Digitais — Criador de Currículos
      </p>
    </div>
  `;

  const result = await sendEmailWithRetry({
    from: getFromEmail(),
    to,
    subject: 'Seu currículo em PDF chegou — pagamento aprovado',
    html,
    attachments,
  });

  return {
    ...result,
    attachmentSent: hasAttachment,
  };
}
