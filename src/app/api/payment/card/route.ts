import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';

const withTimeout = <T,>(promise: Promise<T>, ms = 20000, label = 'payment'): Promise<T> =>
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
    const {
      amount,
      email,
      leadId,
      token,
      issuer_id,
      payment_method_id,
      installments,
      payer,
    } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valor do pagamento inválido.' }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: 'E-mail do pagador é obrigatório.' }, { status: 400 });
    }

    if (!token) {
      return NextResponse.json({ error: 'Token do cartão não foi gerado. Tente novamente.' }, { status: 400 });
    }

    if (!payment_method_id) {
      return NextResponse.json({ error: 'Bandeira do cartão não identificada. Tente novamente.' }, { status: 400 });
    }

    const client = new MercadoPagoConfig({ accessToken });
    const payment = new Payment(client);

    const paymentBody: any = {
      transaction_amount: Number(amount),
      token,
      description: 'Currículo Profissional ATS - LS Soluções Digitais',
      installments: Number(installments) || 1,
      payment_method_id,
      issuer_id: issuer_id ? String(issuer_id) : undefined,
      payer: {
        email,
        ...(payer?.identification ? { identification: payer.identification } : {}),
      },
      external_reference: leadId || `card-payment-${Date.now()}`,
    };

    const result = await withTimeout(
      payment.create({ body: paymentBody }),
      20000,
      'create card'
    );

    return NextResponse.json({
      id: String(result.id),
      status: result.status,
      status_detail: result.status_detail,
      payment_method_id: result.payment_method_id,
      transaction_amount: result.transaction_amount,
    });
  } catch (error: any) {
    const errorPayload = {
      message: error?.message || '',
      code: error?.code || '',
      status: error?.status || error?.statusCode || error?.cause?.status || 0,
      cause: error?.cause ? JSON.stringify(error.cause) : undefined,
      response: error?.response ? JSON.stringify(error.response).slice(0, 500) : undefined,
      timestamp: new Date().toISOString(),
    };
    console.error('Card payment create error:', errorPayload);

    if (error?.message?.includes('timeout')) {
      return NextResponse.json({ error: 'Tempo esgotado ao processar pagamento. Tente novamente.' }, { status: 504 });
    }

    const mpCode = error?.code || error?.cause?.code || '';
    const mpMessage = (error?.message || '').toLowerCase();
    const status = error?.status || error?.statusCode || error?.cause?.status || 0;

    if (mpCode === 'unauthorized' || mpMessage.includes('authorization') || status === 401 || status === 403) {
      return NextResponse.json({ error: 'Token do Mercado Pago inválido ou sem permissão.' }, { status: 401 });
    }
    if (mpCode === 'bad_request' || status === 400) {
      const detail = error?.cause?.message || error?.message || 'Verifique os dados do cartão e tente novamente.';
      return NextResponse.json({ error: `Dados do cartão inválidos: ${detail}` }, { status: 400 });
    }
    if (status === 429) {
      return NextResponse.json({ error: 'Limite de requisições do Mercado Pago atingido. Tente mais tarde.' }, { status: 429 });
    }
    if (status >= 500) {
      return NextResponse.json({ error: 'Erro no serviço do Mercado Pago.' }, { status });
    }

    return NextResponse.json(
      { error: 'Falha ao processar pagamento com cartão. Tente novamente.' },
      { status: 500 }
    );
  }
}
