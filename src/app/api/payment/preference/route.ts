import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';

const withTimeout = <T,>(promise: Promise<T>, ms = 15000, label = 'preference'): Promise<T> =>
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
    const { amount, email, leadId, returnUrl } = await request.json();

    if (!email || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'E-mail e valor são obrigatórios.' },
        { status: 400 }
      );
    }

    const client = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(client);

    const result = await withTimeout(
      preference.create({
        body: {
          items: [
            {
              id: 'curriculo-profissional-ats',
              title: 'Currículo Profissional ATS - LS Soluções Digitais',
              quantity: 1,
              unit_price: amount,
              currency_id: 'BRL',
            },
          ],
          payer: { email },
          external_reference: leadId || `preference-${Date.now()}`,
          back_urls: {
            success: `${returnUrl}?payment_status=approved&external_reference=${leadId || ''}`,
            pending: `${returnUrl}?payment_status=pending&external_reference=${leadId || ''}`,
            failure: `${returnUrl}?payment_status=failure&external_reference=${leadId || ''}`,
          },
          auto_return: 'approved',
          payment_methods: {
            excluded_payment_types: [
              { id: 'ticket' },
              { id: 'atm' },
              { id: 'bank_transfer' },
              { id: 'pix' },
            ],
          },
          notification_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://criador-de-curriculos.vercel.app'}/api/payment/webhook`,
        },
      }),
      15000,
      'create preference'
    );

    return NextResponse.json({
      preferenceId: result.id,
      initPoint: result.init_point,
      sandboxInitPoint: result.sandbox_init_point,
    });
  } catch (error: any) {
    const errorPayload = {
      message: error?.message || '',
      code: error?.code || '',
      status: error?.status || error?.statusCode || error?.cause?.status || 0,
      timestamp: new Date().toISOString(),
    };
    console.error('Payment preference error:', errorPayload);

    if (error?.message?.includes('timeout')) {
      return NextResponse.json({ error: 'Tempo esgotado ao criar checkout.' }, { status: 504 });
    }

    const status = error?.status || error?.statusCode || error?.cause?.status || 0;
    if (status === 401 || status === 403) {
      return NextResponse.json({ error: 'Token do Mercado Pago inválido.' }, { status });
    }

    return NextResponse.json(
      { error: 'Falha ao criar checkout para cartão.' },
      { status: 500 }
    );
  }
}
