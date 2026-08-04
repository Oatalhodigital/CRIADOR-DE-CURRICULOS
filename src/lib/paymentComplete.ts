import { MercadoPagoConfig, Payment } from 'mercadopago';
import { adminDb } from './firebase-admin';
import {
  getOrderByMpPaymentId,
  updateOrderStatusPostgres,
  setOrderResumeSnapshot,
  setOrderPayerEmail,
  insertOrderPostgres,
  insertFunnelEventPostgres,
} from './postgres';
import { getAppUrl, sendPaymentConfirmationEmail } from './email';
import { getPaymentStatusMessage, normalizePaymentMethod } from './mercadoPago';
import { trackMetaPurchaseServerSide } from './metaConversionsApi';
import { Resume } from '@/types/resume';

const withTimeout = <T,>(promise: Promise<T>, ms = 10000, label = 'payment'): Promise<T> =>
  Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timeout`)), ms)
    ),
  ]);

async function getMercadoPagoPayment(mpPaymentId: string): Promise<any | null> {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) return null;
  try {
    const client = new MercadoPagoConfig({ accessToken });
    const payment = new Payment(client);
    return (await withTimeout(payment.get({ id: mpPaymentId }), 10000, 'payment')) as any;
  } catch (err) {
    console.error('[paymentComplete] Mercado Pago get error', err);
    return null;
  }
}

async function ensureApprovedOrder(mpPaymentId: string): Promise<{ order: any; status: string } | { error: string; statusCode: number }> {
  let order = await getOrderByMpPaymentId(mpPaymentId);
  let status = order?.status;

  if (!order) {
    // O pedido pode não ter sido gravado ainda (webhook mais rápido que a rota
    // de criação). Reconstrói a partir dos dados reais do Mercado Pago para não
    // registrar valor 0 nem método errado.
    const mpPayment = await getMercadoPagoPayment(mpPaymentId);
    if (!mpPayment?.status) return { error: 'Pagamento não encontrado.', statusCode: 404 };
    status = mpPayment.status;
    if (status !== 'approved') {
      return { error: getPaymentStatusMessage(status, mpPayment.status_detail), statusCode: 402 };
    }
    const leadId = mpPayment.external_reference ? String(mpPayment.external_reference) : null;
    await insertOrderPostgres({
      lead_firestore_id: leadId,
      resume_firestore_id: leadId,
      plan: mpPayment.metadata?.plan || 'unknown',
      amount_cents: Math.round(Number(mpPayment.transaction_amount || 0) * 100),
      payment_method: normalizePaymentMethod(mpPayment.payment_type_id),
      mp_payment_id: mpPaymentId,
      status,
    });
    order = await getOrderByMpPaymentId(mpPaymentId);
  }

  if (status !== 'approved') {
    const mpPayment = await getMercadoPagoPayment(mpPaymentId);
    const mpStatus = mpPayment?.status;
    if (mpStatus) {
      status = mpStatus;
      await updateOrderStatusPostgres(mpPaymentId, mpStatus);
      if (mpStatus !== 'approved') {
        return { error: getPaymentStatusMessage(mpStatus, mpPayment?.status_detail), statusCode: 402 };
      }
    }
  }

  if (status !== 'approved') {
    return { error: 'Pagamento ainda não foi aprovado.', statusCode: 402 };
  }

  if (order?.status !== 'approved') {
    order = await getOrderByMpPaymentId(mpPaymentId);
  }

  return { order, status };
}

async function fetchResumeFromFirestore(resumeFirestoreId: string | null): Promise<Resume | null> {
  if (!resumeFirestoreId || !adminDb) return null;
  try {
    const doc = await adminDb.collection('resumes').doc(resumeFirestoreId).get();
    const data = doc.data() as Resume | undefined;
    return data || null;
  } catch (err) {
    console.error('[paymentComplete] fetch resume from Firestore failed', err);
    return null;
  }
}

async function resolvePayerEmail(order: any, providedEmail?: string): Promise<string | null> {
  if (providedEmail) return providedEmail;
  if (order?.payer_email) return order.payer_email;
  if (order?.resume_firestore_id) {
    const resume = await fetchResumeFromFirestore(order.resume_firestore_id);
    if (resume?.personalInfo?.email) return resume.personalInfo.email;
  }
  if (order?.lead_firestore_id) {
    const resume = await fetchResumeFromFirestore(order.lead_firestore_id);
    if (resume?.personalInfo?.email) return resume.personalInfo.email;
  }
  return null;
}

export type MetaClientContext = {
  fbp?: string;
  fbc?: string;
  clientIp?: string;
  userAgent?: string;
};

export async function finalizePaymentDelivery({
  mpPaymentId,
  resume,
  email,
  metaContext,
}: {
  mpPaymentId: string;
  resume?: Resume;
  email?: string;
  metaContext?: MetaClientContext;
}) {
  const approved = await ensureApprovedOrder(mpPaymentId);
  if ('error' in approved) return approved;
  const { order } = approved;

  const snapshot = resume || order?.resume_snapshot || (await fetchResumeFromFirestore(order?.resume_firestore_id));
  if (snapshot) {
    await setOrderResumeSnapshot(mpPaymentId, snapshot);
  }

  const payerEmail = await resolvePayerEmail(order, email);
  if (payerEmail) {
    await setOrderPayerEmail(mpPaymentId, payerEmail);
  }

  const downloadUrl = `${getAppUrl()}/api/download/${mpPaymentId}`;

  let emailSent = false;
  let emailError: string | null = null;

  if (payerEmail) {
    try {
      const emailResult = await sendPaymentConfirmationEmail(
        payerEmail,
        mpPaymentId,
        order?.plan || 'unknown',
        downloadUrl
      );
      emailSent = emailResult.success;
      if (!emailResult.success && emailResult.error) {
        emailError = emailResult.error;
        console.error('[paymentComplete] e-mail not sent', { error: emailResult.error, mpPaymentId, payerEmail });
      }
    } catch (err) {
      console.error('[paymentComplete] unexpected e-mail error', { err, mpPaymentId, payerEmail });
      emailError = err instanceof Error ? err.message : 'Erro inesperado ao enviar e-mail';
    }
  }

  await insertFunnelEventPostgres({
    lead_firestore_id: order?.lead_firestore_id || order?.resume_firestore_id || null,
    event_name: 'payment_delivered',
    metadata: { mp_payment_id: mpPaymentId, email_sent: emailSent, email_error: emailError, plan: order?.plan },
  });

  const amountReais = order?.amount_cents ? order.amount_cents / 100 : 0;
  const userEmail = payerEmail || resume?.personalInfo?.email;
  const userPhone = resume?.personalInfo?.phone;

  // Fire-and-forget: a falha do CAPI nao pode bloquear o download.
  void trackMetaPurchaseServerSide({
    paymentId: mpPaymentId,
    value: amountReais,
    plan: order?.plan,
    paymentMethod: order?.payment_method,
    email: userEmail,
    phone: userPhone,
    sourceUrl: getAppUrl(),
    ...metaContext,
  });

  return {
    success: true,
    downloadUrl,
    emailSent,
    emailError,
    payerEmail,
    downloadsAllowed: order?.downloads_allowed || 1,
    downloadsUsed: order?.downloads_used || 0,
    plan: order?.plan,
  };
}
