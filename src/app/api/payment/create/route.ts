import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';

const withTimeout = <T,>(promise: Promise<T>, ms = 15000, label = 'payment'): Promise<T> =>
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
    const { amount = 10, email, leadId } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'E-mail é obrigatório.' }, { status: 400 });
    }

    const client = new MercadoPagoConfig({ accessToken });
    const payment = new Payment(client);

    const result = await withTimeout(
      payment.create({
        body: {
          transaction_amount: amount,
          description: 'Currículo Profissional ATS - LS Soluções Digitais',
          payment_method_id: 'pix',
          payer: { email },
          external_reference: leadId || `payment-${Date.now()}`,
        },
      }),
      15000,
      'create pix'
    );

    const transactionData = result.point_of_interaction?.transaction_data;

    return NextResponse.json({
      id: String(result.id),
      status: result.status,
      qr_code: transactionData?.qr_code || '',
      qr_code_base64: transactionData?.qr_code_base64 || '',
    });
  } catch (error: any) {
    console.error('Payment create error:', { error, timestamp: new Date().toISOString() });

    if (error?.message?.includes('timeout')) {
      return NextResponse.json({ error: 'Tempo esgotado ao criar pagamento.' }, { status: 504 });
    }

    const status = error?.status || error?.statusCode || error?.cause?.status;
    if (status === 401 || status === 403) {
      return NextResponse.json({ error: 'Token do Mercado Pago inválido ou sem permissão.' }, { status });
    }
    if (status === 429) {
      return NextResponse.json({ error: 'Limite de requisições do Mercado Pago atingido. Tente novamente mais tarde.' }, { status });
    }
    if (status >= 500) {
      return NextResponse.json({ error: 'Erro no serviço do Mercado Pago.' }, { status });
    }

    return NextResponse.json(
      { error: 'Falha ao criar pagamento PIX.' },
      { status: 500 }
    );
  }
}
