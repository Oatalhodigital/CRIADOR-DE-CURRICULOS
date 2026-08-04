import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createHash } from 'crypto';
import { insertOrderPostgres, insertFunnelEventPostgres } from '@/lib/postgres';
import { getNotificationUrl, getPaymentStatusMessage } from '@/lib/mercadoPago';

const splitName = (fullName?: string) => {
  const parts = (fullName || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { first_name: undefined, last_name: undefined };
  return { first_name: parts[0], last_name: parts.slice(1).join(' ') || undefined };
};

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
      plan,
      token,
      issuer_id,
      payment_method_id,
      installments,
      payer,
      deviceId,
      payerName,
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

    const transactionAmount = Number(amount);
    const description = 'Currículo Profissional ATS - LS Soluções Digitais';
    const { first_name, last_name } = splitName(payerName || payer?.first_name);
    const identification = payer?.identification?.number ? payer.identification : undefined;
    const externalReference = leadId || `card-payment-${Date.now()}`;

    // Quanto mais informação enviada, maior a taxa de aprovação do antifraude do
    // Mercado Pago (evita recusas como cc_rejected_high_risk em compras legítimas).
    const paymentBody: any = {
      transaction_amount: transactionAmount,
      token,
      description,
      statement_descriptor: 'CURRICULORAPIDO',
      installments: Number(installments) || 1,
      payment_method_id,
      issuer_id: issuer_id ? String(issuer_id) : undefined,
      payer: {
        email,
        ...(first_name ? { first_name } : {}),
        ...(last_name ? { last_name } : {}),
        ...(identification ? { identification } : {}),
      },
      additional_info: {
        items: [
          {
            id: plan || 'single',
            title: description,
            description: `Plano ${plan || 'single'}`,
            category_id: 'services',
            quantity: 1,
            unit_price: transactionAmount,
          },
        ],
        payer: {
          ...(first_name ? { first_name } : {}),
          ...(last_name ? { last_name } : {}),
        },
      },
      external_reference: externalReference,
      notification_url: getNotificationUrl(),
      metadata: { lead_id: leadId || null, plan: plan || 'unknown' },
    };

    const result = await withTimeout(
      payment.create({
        body: paymentBody,
        requestOptions: {
          // Evita cobranças duplicadas em caso de retry da requisição.
          idempotencyKey: createHash('sha256')
            .update(`${externalReference}|${token}|${transactionAmount}`)
            .digest('hex')
            .slice(0, 40),
          // Device ID coletado pelo SDK do Mercado Pago no navegador. Recomendado
          // pela documentação para melhorar a aprovação antifraude.
          ...(deviceId ? { meliSessionId: String(deviceId) } : {}),
        },
      }),
      20000,
      'create card'
    );

    const amountCents = Math.round(transactionAmount * 100);
    const status = result.status || 'pending';

    // Precisa ser aguardado: em serverless a execução é congelada assim que a
    // resposta é devolvida, e a escrita ficaria pela metade.
    try {
      await insertOrderPostgres({
        lead_firestore_id: leadId || null,
        resume_firestore_id: leadId || null,
        plan: plan || 'unknown',
        amount_cents: amountCents,
        payment_method: 'credit_card',
        mp_payment_id: result.id ? String(result.id) : null,
        status,
      });
      await insertFunnelEventPostgres({
        lead_firestore_id: leadId || null,
        event_name: 'checkout_started',
        metadata: { plan, amount_cents: amountCents, payment_method: 'credit_card', status },
      });
    } catch (postgresErr) {
      console.error('[api/payment/card] analytics write failed', postgresErr);
    }

    console.log('[api/payment/card] pagamento criado', {
      id: String(result.id),
      status,
      status_detail: result.status_detail,
      hasDeviceId: Boolean(deviceId),
      hasIdentification: Boolean(identification),
    });

    return NextResponse.json({
      id: String(result.id),
      status,
      status_detail: result.status_detail,
      message: getPaymentStatusMessage(status, result.status_detail),
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
