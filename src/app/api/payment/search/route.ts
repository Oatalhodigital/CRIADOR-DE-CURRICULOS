import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';

const withTimeout = <T,>(promise: Promise<T>, ms = 15000, label = 'payment search'): Promise<T> =>
  Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timeout`)), ms)
    ),
  ]);

export async function GET(request: NextRequest) {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

  if (!accessToken) {
    return NextResponse.json(
      { error: 'Pagamento não configurado.' },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const externalReference = searchParams.get('external_reference');

  if (!externalReference) {
    return NextResponse.json(
      { error: 'Referência externa é obrigatória.' },
      { status: 400 }
    );
  }

  try {
    const client = new MercadoPagoConfig({ accessToken });
    const payment = new Payment(client);

    const result = await withTimeout(
      payment.search({
        options: {
          external_reference: externalReference,
          sort: 'date_created',
          criteria: 'desc',
          limit: 10,
        },
      }),
      15000,
      'search payment'
    );

    const payments = result.results || [];
    const approvedPayment = payments.find((p) => p.status === 'approved');

    if (approvedPayment) {
      return NextResponse.json({
        found: true,
        approved: true,
        paymentId: String(approvedPayment.id),
        status: approvedPayment.status,
      });
    }

    const pendingPayment = payments.find((p) => p.status === 'pending' || p.status === 'in_process');

    return NextResponse.json({
      found: payments.length > 0,
      approved: false,
      paymentId: pendingPayment ? String(pendingPayment.id) : null,
      status: pendingPayment?.status || null,
    });
  } catch (error: any) {
    const errorPayload = {
      message: error?.message || '',
      code: error?.code || '',
      status: error?.status || error?.statusCode || error?.cause?.status || 0,
      timestamp: new Date().toISOString(),
    };
    console.error('Payment search error:', errorPayload);

    if (error?.message?.includes('timeout')) {
      return NextResponse.json({ error: 'Tempo esgotado ao buscar pagamento.' }, { status: 504 });
    }

    const status = error?.status || error?.statusCode || error?.cause?.status || 0;
    if (status === 401 || status === 403) {
      return NextResponse.json({ error: 'Token do Mercado Pago inválido.' }, { status });
    }

    return NextResponse.json(
      { error: 'Falha ao buscar status do pagamento.' },
      { status: 500 }
    );
  }
}
