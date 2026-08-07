import { NextResponse } from 'next/server';
import { getPendingPixReminders, markPixReminderSent } from '@/lib/postgres';
import { sendEmailWithRetry, getFromEmail, getAppUrl } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function GET() {
  const start = Date.now();
  const pending = await getPendingPixReminders(15, 50);
  let sent = 0;
  let failed = 0;

  for (const order of pending) {
    const to = order.payer_email;
    const paymentId = order.mp_payment_id;
    const plan = order.plan || 'Escolhido';
    const amount = (Number(order.amount_cents) / 100).toFixed(2).replace('.', ',');
    const checkoutUrl = `${getAppUrl()}?payment_id=${paymentId}&plan=${encodeURIComponent(plan)}`;

    try {
      const qrCode = order.metadata?.qr_code || '';
      const pixBlock = qrCode
        ? `<p style="margin: 16px 0; padding: 12px; background: #f3f4f6; border-radius: 6px; word-break: break-all; font-family: monospace; font-size: 12px;">${qrCode}</p>`
        : '';

      const result = await sendEmailWithRetry({
        from: getFromEmail(),
        to,
        subject: 'Seu currículo está quase pronto — finalize o pagamento do PIX',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #059669;">Não deixe seu currículo de lado!</h2>
            <p>Olá,</p>
            <p>Você iniciou a compra do plano <strong>${plan}</strong> por <strong>R$ ${amount}</strong>, mas o pagamento via PIX ainda não foi confirmado.</p>
            <p>O PIX continua válido. Use o código abaixo ou volte ao site para gerar novamente:</p>
            ${pixBlock}
            <p style="margin: 24px 0; text-align: center;">
              <a href="${checkoutUrl}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Finalizar pagamento</a>
            </p>
            <p style="font-size: 12px; color: #6b7280;">Caso já tenha pago, ignore este e-mail — estamos processando a confirmação.</p>
          </div>
        `,
      });

      if (result.success) {
        await markPixReminderSent(paymentId, true);
        sent++;
      } else {
        await markPixReminderSent(paymentId, false);
        failed++;
      }
    } catch (err) {
      console.error('[cron/pix-reminder] unexpected error', { paymentId, to, err });
      failed++;
    }
  }

  console.log('[cron/pix-reminder] finished', {
    durationMs: Date.now() - start,
    checked: pending.length,
    sent,
    failed,
  });

  return NextResponse.json({ ok: true, checked: pending.length, sent, failed });
}
