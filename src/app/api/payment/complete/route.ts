import { NextRequest, NextResponse } from 'next/server';
import { finalizePaymentDelivery } from '@/lib/paymentComplete';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const paymentId = body?.paymentId || body?.mpPaymentId;

    if (!paymentId || typeof paymentId !== 'string') {
      return NextResponse.json({ error: 'paymentId é obrigatório.' }, { status: 400 });
    }

    const result = await finalizePaymentDelivery({
      mpPaymentId: paymentId,
      resume: body?.resume,
      email: body?.email,
    });

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.statusCode });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('[api/payment/complete] error', err);
    const details = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'Falha ao preparar download.', details }, { status: 500 });
  }
}
