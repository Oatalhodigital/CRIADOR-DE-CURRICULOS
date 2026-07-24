import { MercadoPagoConfig, Payment } from 'mercadopago';
import { adminDb } from './firebase-admin';
import {
  getOrderByMpPaymentId,
  updateOrderStatusPostgres,
  setOrderResumeSnapshot,
  setOrderPayerEmail,
  markConfirmationEmailSent,
  insertOrderPostgres,
  insertFunnelEventPostgres,
} from './postgres';
import { sendPaymentConfirmationEmail, getAppUrl } from './email';
import { Resume } from '@/types/resume';

const withTimeout = <T,>(promise: Promise<T>, ms = 10000, label = 'payment'): Promise<T> =>
  Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timeout`)), ms)
    ),
  ]);

async function getMercadoPagoPaymentStatus(mpPaymentId: string): Promise<string | null> {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) return null;
  try {
    const client = new MercadoPagoConfig({ accessToken });
    const payment = new Payment(client);
    const result = (await withTimeout(payment.get({ id: mpPaymentId }), 10000, 'payment')) as any;
    return result?.status || null;
  } catch (err) {
    console.error('[paymentComplete] Mercado Pago get error', err);
    return null;
  }
}

async function ensureApprovedOrder(mpPaymentId: string): Promise<{ order: any; status: string } | { error: string; statusCode: number }> {
  let order = await getOrderByMpPaymentId(mpPaymentId);
  let status = order?.status;

  if (!order) {
    const mpStatus = await getMercadoPagoPaymentStatus(mpPaymentId);
    if (!mpStatus) return { error: 'Pagamento não encontrado.', statusCode: 404 };
    status = mpStatus;
    if (status !== 'approved') return { error: 'Pagamento ainda não foi aprovado.', statusCode: 402 };
    await insertOrderPostgres({
      lead_firestore_id: null,
      resume_firestore_id: null,
      plan: 'unknown',
      amount_cents: 0,
      payment_method: 'pix',
      mp_payment_id: mpPaymentId,
      status,
    });
    order = await getOrderByMpPaymentId(mpPaymentId);
  }

  if (status !== 'approved') {
    const mpStatus = await getMercadoPagoPaymentStatus(mpPaymentId);
    if (mpStatus === 'approved') {
      status = 'approved';
      await updateOrderStatusPostgres(mpPaymentId, 'approved');
    } else if (mpStatus) {
      status = mpStatus;
      await updateOrderStatusPostgres(mpPaymentId, mpStatus);
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

export async function finalizePaymentDelivery({
  mpPaymentId,
  resume,
  email,
}: {
  mpPaymentId: string;
  resume?: Resume;
  email?: string;
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

  if (payerEmail && !order?.confirmation_email_sent_at) {
    const result = await sendPaymentConfirmationEmail(payerEmail, mpPaymentId, order?.plan || 'unknown', downloadUrl);
    emailSent = result.success;
    if (result.success) {
      await markConfirmationEmailSent(mpPaymentId, true);
    } else {
      await markConfirmationEmailSent(mpPaymentId, false);
    }
  }

  await insertFunnelEventPostgres({
    lead_firestore_id: order?.lead_firestore_id || order?.resume_firestore_id || null,
    event_name: 'payment_delivered',
    metadata: { mp_payment_id: mpPaymentId, email_sent: emailSent, plan: order?.plan },
  });

  return {
    success: true,
    downloadUrl,
    emailSent,
    payerEmail,
    downloadsAllowed: order?.downloads_allowed || 1,
    downloadsUsed: order?.downloads_used || 0,
    plan: order?.plan,
  };
}
