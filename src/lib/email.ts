import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export function getFromEmail(): string {
  return process.env.EMAIL_FROM || 'Criador de Currículos <no-reply@resend.dev>';
}

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 'https://criador-de-curriculos.vercel.app';
}

export async function sendPaymentConfirmationEmail(
  to: string,
  paymentId: string,
  plan: string,
  downloadUrl: string
) {
  if (!resend) {
    console.error('[email] RESEND_API_KEY not configured');
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  const planLabels: Record<string, string> = {
    single: 'Básico',
    weekly: 'Intermediário',
    monthly: 'Completo',
  };

  try {
    const result = await resend.emails.send({
      from: getFromEmail(),
      to,
      subject: 'Seu currículo foi aprovado — link de download',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">Pagamento aprovado!</h2>
          <p>Olá,</p>
          <p>Recebemos a confirmação do seu pagamento (<strong>#${paymentId}</strong>) referente ao plano <strong>${planLabels[plan] || plan}</strong>.</p>
          <p>Seu currículo em PDF está pronto para download. Clique no botão abaixo para baixar:</p>
          <p style="margin: 24px 0;">
            <a href="${downloadUrl}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Baixar currículo em PDF</a>
          </p>
          <p>Caso o botão não funcione, copie e cole o link no navegador:</p>
          <p style="word-break: break-all; color: #374151;">${downloadUrl}</p>
          <p>O link é válido de acordo com o limite de downloads do seu plano.</p>
          <p style="font-size: 12px; color: #6b7280;">LS Soluções Digitais — Criador de Currículos</p>
        </div>
      `,
    });
    return { success: true, data: result };
  } catch (err) {
    console.error('[email] sendPaymentConfirmationEmail failed', err);
    return { success: false, error: err instanceof Error ? err.message : 'Erro ao enviar e-mail' };
  }
}
