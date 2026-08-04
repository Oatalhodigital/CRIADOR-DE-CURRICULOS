import crypto from 'crypto';

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '';
export const META_CONVERSIONS_API_TOKEN = process.env.META_CONVERSIONS_API_TOKEN || '';

export const isMetaConversionsEnabled = () => Boolean(META_PIXEL_ID && META_CONVERSIONS_API_TOKEN);

const API_VERSION = 'v21.0';
const CAPI_URL = `https://graph.facebook.com/${API_VERSION}/${META_PIXEL_ID}/events`;

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '').trim();
}

function hashPhone(phone: string): string {
  const normalized = normalizePhone(phone);
  // Meta expects a leading country code (e.g. 5511999999999). If the number
  // does not start with a country code and is 10-11 digits, assume Brazilian 55.
  const withCountry = /^\d{10,11}$/.test(normalized) && !normalized.startsWith('55')
    ? `55${normalized}`
    : normalized;
  return sha256(withCountry);
}

function hashEmail(email?: string): string | undefined {
  if (!email) return undefined;
  return sha256(normalizeEmail(email));
}

type MetaEvent = {
  event_name: string;
  event_time: number;
  event_id?: string;
  event_source_url?: string;
  action_source: 'website';
  user_data: Record<string, string | undefined>;
  custom_data: Record<string, string | number | undefined>;
};

async function sendEvents(events: MetaEvent[]) {
  if (!isMetaConversionsEnabled()) {
    console.log('[meta capi] not configured; skipping');
    return { success: false, error: 'not_configured' };
  }

  try {
    const response = await fetch(CAPI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: events,
        access_token: META_CONVERSIONS_API_TOKEN,
        test_event_code: process.env.META_CAPI_TEST_EVENT_CODE,
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => 'unknown error');
      console.error('[meta capi] failed', { status: response.status, body: text });
      return { success: false, error: text };
    }

    const data = await response.json().catch(() => ({}));
    console.log('[meta capi] sent', { events: events.length, result: data });
    return { success: true, data };
  } catch (err) {
    console.error('[meta capi] network error', err);
    return { success: false, error: err instanceof Error ? err.message : 'network error' };
  }
}

export async function trackMetaPurchaseServerSide({
  paymentId,
  value,
  plan,
  paymentMethod,
  email,
  phone,
  sourceUrl,
  fbp,
  fbc,
  clientIp,
  userAgent,
}: {
  paymentId: string;
  value: number;
  plan?: string;
  paymentMethod?: string;
  email?: string;
  phone?: string;
  sourceUrl?: string;
  fbp?: string;
  fbc?: string;
  clientIp?: string;
  userAgent?: string;
}) {
  const event: MetaEvent = {
    event_name: 'Purchase',
    event_time: Math.floor(Date.now() / 1000),
    event_id: paymentId,
    event_source_url: sourceUrl,
    action_source: 'website',
    user_data: {
      em: hashEmail(email),
      ph: phone ? hashPhone(phone) : undefined,
      // fbp/fbc, IP e user agent elevam a qualidade da correspondência do evento
      // e permitem atribuir a venda ao clique no anúncio.
      fbp,
      fbc,
      client_ip_address: clientIp,
      client_user_agent: userAgent,
    },
    custom_data: {
      value,
      currency: 'BRL',
      content_ids: paymentId,
      content_type: 'product',
      plan: plan || 'unknown',
      payment_method: paymentMethod || 'unknown',
    },
  };

  return sendEvents([event]);
}
