import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { adminDb } from '@/lib/firebase-admin';
import { updateOrderStatusPostgres, insertFunnelEventPostgres } from '@/lib/postgres';
import { finalizePaymentDelivery } from '@/lib/paymentComplete';

const withTimeout = <T,>(promise: Promise<T>, ms = 10000, label = 'webhook'): Promise<T> =>
  Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timeout`)), ms)
    ),
  ]);

export async function POST(request: NextRequest) {
  const start = Date.now();
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

  console.log('[api/payment/webhook] start', { timestamp: new Date().toISOString() });

  if (!accessToken) {
    console.error('[api/payment/webhook] MERCADO_PAGO_ACCESS_TOKEN não configurado');
    return NextResponse.json(
      { error: 'Pagamento não configurado.' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { data, type } = body;

    if (type === 'payment' && data?.id) {
      const paymentId = data.id;

      const client = new MercadoPagoConfig({ accessToken });
      const payment = new Payment(client);

      const paymentData = await withTimeout(
        payment.get({ id: paymentId }),
        10000,
        'webhook payment get'
      );

      if (paymentData.status === 'approved') {
        if (adminDb) {
          const leadRef = adminDb
            .collection('leads')
            .doc(String(paymentData.external_reference || paymentId));

          try {
            const leadDoc = await withTimeout(leadRef.get(), 8000, 'webhook get lead');

            if (leadDoc.exists) {
              await withTimeout(
                leadRef.update({
                  paymentStatus: 'approved',
                  paymentId: paymentId,
                  paymentApprovedAt: new Date().toISOString(),
                }),
                8000,
                'webhook update lead'
              );
            }
          } catch (firestoreErr: any) {
            console.error('[api/payment/webhook] erro ao atualizar lead no Firestore', {
              error: firestoreErr?.message || String(firestoreErr),
              paymentId,
            });
          }
        } else {
          console.warn('[api/payment/webhook] adminDb não configurado; lead não atualizado');
        }

        // Analytics complementar em Postgres (não bloqueia o fluxo principal)
        try {
          const status = paymentData.status === 'approved' ? 'approved' : (paymentData.status || 'unknown');
          updateOrderStatusPostgres(String(paymentId), status);
          insertFunnelEventPostgres({
            lead_firestore_id: String(paymentData.external_reference || ''),
            event_name: 'payment_approved',
            metadata: { payment_id: String(paymentId), amount: paymentData.transaction_amount },
          });
        } catch (postgresErr) {
          console.error('[api/payment/webhook] analytics write failed', postgresErr);
        }

        // Dispara download automático (snapshot + e-mail) de forma assíncrona
        try {
          const payerEmail = (paymentData as any)?.payer?.email;
          await finalizePaymentDelivery({
            mpPaymentId: String(paymentId),
            email: payerEmail,
          });
        } catch (deliveryErr) {
          console.error('[api/payment/webhook] finalizePaymentDelivery failed', deliveryErr);
        }

        console.log(`[api/payment/webhook] pagamento ${paymentId} aprovado para ${paymentData.payer?.email}`);
      }
    }

    console.log('[api/payment/webhook] end', { durationMs: Date.now() - start });
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[api/payment/webhook] error', {
      error: error?.message || String(error),
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - start,
    });
    const status = error?.message?.includes('timeout') ? 504 : 500;
    return NextResponse.json(
      { error: error?.message?.includes('timeout') ? 'Tempo esgotado ao processar webhook.' : 'Erro ao processar webhook.' },
      { status }
    );
  }
}