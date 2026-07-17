import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const withTimeout = <T,>(promise: Promise<T>, ms = 10000, label = 'webhook'): Promise<T> =>
  Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timeout`)), ms)
    ),
  ]);

export async function POST(request: NextRequest) {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

  if (!accessToken) {
    return NextResponse.json(
      { error: 'Pagamento não configurado.' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { data, type } = body;

    // Mercado Pago sends webhook notifications for payment events
    if (type === 'payment' && data?.id) {
      const paymentId = data.id;

      // Verify payment status with Mercado Pago
      const client = new MercadoPagoConfig({ accessToken });
      const payment = new Payment(client);

      const paymentData = await withTimeout(payment.get({ id: paymentId }), 10000, 'webhook payment get');

      if (paymentData.status === 'approved') {
        // Find the lead/resume associated with this payment
        // For simplicity, we'll store the payment ID in the leads collection
        // In production, you'd have a proper payments collection
        
        // Update payment status in Firestore (only if db is configured)
        if (db) {
          const leadsRef = doc(db, 'leads', paymentData.external_reference || paymentId);
          const leadDoc = await withTimeout(getDoc(leadsRef), 8000, 'webhook get lead');

          if (leadDoc.exists()) {
            await withTimeout(
              updateDoc(leadsRef, {
                paymentStatus: 'approved',
                paymentId: paymentId,
                paymentApprovedAt: new Date().toISOString(),
              }),
              8000,
              'webhook update lead'
            );
          }
        }

        console.log(`Payment ${paymentId} approved for ${paymentData.payer?.email}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', { error, timestamp: new Date().toISOString() });
    const status = error?.message?.includes('timeout') ? 504 : 500;
    return NextResponse.json(
      { error: error?.message?.includes('timeout') ? 'Tempo esgotado ao processar webhook.' : 'Erro ao processar webhook.' },
      { status }
    );
  }
}
