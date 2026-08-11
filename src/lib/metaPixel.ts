export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || ''

export const isMetaEnabled = () => Boolean(META_PIXEL_ID)

type MetaEventOptions = {
  eventID?: string
}

type MetaParams = Record<string, string | number | boolean | string[] | undefined>

type AdvancedMatchingData = {
  em?: string
  ph?: string
  fn?: string
  ln?: string
}

declare global {
  interface Window {
    fbq?: (command: string, ...args: unknown[]) => void
    _fbq?: unknown[]
  }
}

const safeFbq = (command: string, ...args: unknown[]) => {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') {
    return
  }
  try {
    window.fbq(command, ...args)
  } catch (err) {
    console.error('[meta pixel] failed to send event', command, args, err)
  }
}

/**
 * Tracks a standard Meta Pixel event. No-op when NEXT_PUBLIC_META_PIXEL_ID
 * is not configured or when running on the server.
 * Supports Advanced Matching via optional user data parameter.
 */
export const trackMeta = (
  eventName: string,
  params: MetaParams = {},
  options?: MetaEventOptions,
  userData?: AdvancedMatchingData
) => {
  if (typeof window === 'undefined' || !isMetaEnabled()) {
    return
  }
  try {
    const eventParams: Record<string, unknown> = { ...params }
    if (userData) {
      eventParams.em = userData.em
      eventParams.ph = userData.ph
      eventParams.fn = userData.fn
      eventParams.ln = userData.ln
    }
    if (options?.eventID) {
      safeFbq('track', eventName, eventParams, { eventID: options.eventID })
    } else {
      safeFbq('track', eventName, eventParams)
    }
  } catch (err) {
    console.error('[meta pixel] failed to send event', eventName, err)
  }
}

export const trackMetaCustom = (eventName: string, params: MetaParams = {}, options?: MetaEventOptions) => {
  if (typeof window === 'undefined' || !isMetaEnabled()) {
    return
  }
  try {
    if (options?.eventID) {
      safeFbq('trackCustom', eventName, params, { eventID: options.eventID })
    } else {
      safeFbq('trackCustom', eventName, params)
    }
  } catch (err) {
    console.error('[meta pixel] failed to send custom event', eventName, err)
  }
}

/**
 * Generates a unique event ID for deduplication between client-side pixel
 * and server-side Conversions API.
 */
export const generateEventId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}

/**
 * Hashes a string using SHA-256 via the Web Crypto API.
 * Returns lowercase hex string. No-op if crypto is unavailable.
 */
async function sha256(value: string): Promise<string | undefined> {
  if (typeof window === 'undefined' || !window.crypto?.subtle) return undefined
  try {
    const encoder = new TextEncoder()
    const data = encoder.encode(value.toLowerCase().trim())
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  } catch {
    return undefined
  }
}

/**
 * Builds Advanced Matching user data with SHA-256 hashed PII.
 * Meta requires PII to be hashed before sending via pixel.
 */
async function buildAdvancedMatching(params: {
  email?: string
  phone?: string
  firstName?: string
  lastName?: string
}): Promise<AdvancedMatchingData | undefined> {
  const { email, phone, firstName, lastName } = params
  if (!email && !phone && !firstName && !lastName) return undefined

  const data: AdvancedMatchingData = {}
  if (email) data.em = await sha256(email)
  if (phone) {
    const normalized = phone.replace(/\D/g, '')
    const withCountry = /^\d{10,11}$/.test(normalized) && !normalized.startsWith('55')
      ? `55${normalized}`
      : normalized
    data.ph = await sha256(withCountry)
  }
  if (firstName) data.fn = await sha256(firstName)
  if (lastName) data.ln = await sha256(lastName)

  const hasAny = Object.values(data).some((v) => v !== undefined)
  return hasAny ? data : undefined
}

/**
 * Lead event — fired after lead is successfully saved server-side.
 * Includes Advanced Matching with hashed email/phone/name.
 */
export const trackMetaLead = async (params?: {
  email?: string
  phone?: string
  firstName?: string
  lastName?: string
  eventId?: string
}) => {
  const userData = await buildAdvancedMatching(params || {})
  trackMeta('Lead', {}, params?.eventId ? { eventID: params.eventId } : undefined, userData)
}

/**
 * InitiateCheckout — fired when user selects a plan and opens checkout.
 * Uses only standard Meta parameters.
 */
export const trackMetaInitiateCheckout = (plan: string, value: number) =>
  trackMeta('InitiateCheckout', {
    value,
    currency: 'BRL',
    content_ids: [plan],
    content_type: 'product',
    num_items: 1,
  })

/**
 * Purchase — fired ONLY after backend confirms payment is approved.
 * Uses standard Meta parameters (order_id, not transaction_id).
 * eventID matches the server-side CAPI event_id for deduplication.
 */
export const trackMetaPurchase = (params: {
  transactionId?: string
  value: number
  paymentMethod?: string
  plan?: string
}) => {
  trackMeta(
    'Purchase',
    {
      value: params.value,
      currency: 'BRL',
      order_id: params.transactionId,
      content_ids: [params.plan || 'unknown'],
      content_type: 'product',
      num_items: 1,
    },
    { eventID: params.transactionId }
  )
}

export const trackMetaStepCompleted = (stepIndex: number, stepName: string) =>
  trackMetaCustom('StepCompleted', { step_number: stepIndex + 1, step_name: stepName })
