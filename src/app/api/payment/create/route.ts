import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';

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

    const result = await payment.create({
      body: {
        transaction_amount: amount,
        description: 'Currículo Profissional ATS - LS Soluções Digitais',
        payment_method_id: 'pix',
        payer: { email },
        external_reference: leadId || `payment-${Date.now()}`,
      },
    });

    const transactionData = result.point_of_interaction?.transaction_data;

    return NextResponse.json({
      id: String(result.id),
      status: result.status,
      qr_code: transactionData?.qr_code || '',
      qr_code_base64: transactionData?.qr_code_base64 || '',
    });
  } catch (error) {
    console.error('Payment create error:', error);
    return NextResponse.json(
      { error: 'Falha ao criar pagamento PIX.' },
      { status: 500 }
    );
  }
}
