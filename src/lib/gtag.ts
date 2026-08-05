export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ''

export const isGaEnabled = () => Boolean(GA_MEASUREMENT_ID)

type GtagParams = Record<string, string | number | boolean | undefined>

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

/**
 * Sends a GA4 event. No-op when the measurement ID is not configured
 * (e.g. local development) or when running on the server.
 */
export const trackEvent = (name: string, params: GtagParams = {}) => {
  if (typeof window === 'undefined' || !isGaEnabled() || typeof window.gtag !== 'function') {
    return
  }

  try {
    window.gtag('event', name, params)
  } catch (err) {
    console.error('[gtag] failed to send event', name, err)
  }
}

export const trackLeadCaptured = () => trackEvent('lead_captured')

export const trackStepCompleted = (stepIndex: number, stepName: string) =>
  trackEvent('step_completed', { step_number: stepIndex + 1, step_name: stepName })

export const trackCheckoutStarted = (plan: string, value: number) =>
  trackEvent('checkout_started', { plan, value, currency: 'BRL' })

export const trackPurchase = (params: {
  transactionId?: string
  value: number
  paymentMethod?: string
  plan?: string
}) =>
  trackEvent('purchase', {
    event_id: params.transactionId,
    transaction_id: params.transactionId,
    value: params.value,
    currency: 'BRL',
    payment_method: params.paymentMethod,
    plan: params.plan,
  })
