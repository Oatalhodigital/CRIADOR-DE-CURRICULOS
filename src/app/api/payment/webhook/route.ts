import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
      
      const paymentData = await payment.get({ id: paymentId });

      if (paymentData.status === 'approved') {
        // Find the lead/resume associated with this payment
        // For simplicity, we'll store the payment ID in the leads collection
        // In production, you'd have a proper payments collection
        
        // Update payment status in Firestore (only if db is configured)
        if (db) {
          const leadsRef = doc(db, 'leads', paymentData.external_reference || paymentId);
          const leadDoc = await getDoc(leadsRef);
          
          if (leadDoc.exists()) {
            await updateDoc(leadsRef, {
              paymentStatus: 'approved',
              paymentId: paymentId,
              paymentApprovedAt: new Date().toISOString(),
            });
          }
        }

        console.log(`Payment ${paymentId} approved for ${paymentData.payer?.email}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Erro ao processar webhook.' },
      { status: 500 }
    );
  }
}
