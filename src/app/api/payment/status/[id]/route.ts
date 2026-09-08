import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';

const withTimeout = <T,>(promise: Promise<T>, ms = 10000, label = 'payment'): Promise<T> =>
  Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timeout`)), ms)
    ),
  ]);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

  if (!accessToken) {
    return NextResponse.json(
      { error: 'Pagamento não configurado.' },
      { status: 503 }
    );
  }

  try {
    const { id } = await params;

    const client = new MercadoPagoConfig({ accessToken });
    const payment = new Payment(client);

    const result = await withTimeout(payment.get({ id }), 10000, 'payment status');

    const response: Record<string, unknown> = {
      id: String(result.id),
      status: result.status,
      approved: result.status === 'approved',
    };

    // Return PIX data for recovery after reload — only when pending
    if (result.status === 'pending' || result.status === 'in_process') {
      response.amount = result.transaction_amount ?? null;
      const pixData = (result as any).point_of_interaction?.transaction_data;
      if (pixData) {
        response.qr_code = pixData.qr_code || '';
        response.qr_code_base64 = pixData.qr_code_base64 || '';
      }
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Payment status error:', { error, timestamp: new Date().toISOString() });

    if (error?.message?.includes('timeout')) {
      return NextResponse.json({ error: 'Tempo esgotado ao verificar pagamento.' }, { status: 504 });
    }

    const status = error?.status || error?.statusCode || error?.cause?.status;
    if (status === 401 || status === 403) {
      return NextResponse.json({ error: 'Token do Mercado Pago inválido.' }, { status });
    }
    if (status === 404) {
      return NextResponse.json({ error: 'Pagamento não encontrado.' }, { status });
    }
    if (status === 429) {
      return NextResponse.json({ error: 'Limite de requisições do Mercado Pago atingido.' }, { status });
    }

    return NextResponse.json(
      { error: 'Falha ao verificar pagamento.' },
      { status: 500 }
    );
  }
}
