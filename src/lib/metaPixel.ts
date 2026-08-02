export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || ''

export const isMetaEnabled = () => Boolean(META_PIXEL_ID)

type MetaEventOptions = {
  eventID?: string
}

type MetaParams = Record<string, string | number | boolean | undefined>

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
 */
export const trackMeta = (eventName: string, params: MetaParams = {}, options?: MetaEventOptions) => {
  if (typeof window === 'undefined' || !isMetaEnabled()) {
    return
  }
  try {
    if (options?.eventID) {
      safeFbq('track', eventName, params, { eventID: options.eventID })
    } else {
      safeFbq('track', eventName, params)
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

export const trackMetaLead = () => trackMeta('Lead')

export const trackMetaInitiateCheckout = (plan: string, value: number) =>
  trackMeta('InitiateCheckout', { plan, value, currency: 'BRL' })

export const trackMetaPurchase = (params: {
  transactionId?: string
  value: number
  paymentMethod?: string
  plan?: string
}) =>
  trackMeta(
    'Purchase',
    {
      transaction_id: params.transactionId,
      value: params.value,
      currency: 'BRL',
      payment_method: params.paymentMethod,
      plan: params.plan,
    },
    { eventID: params.transactionId }
  )

export const trackMetaStepCompleted = (stepIndex: number, stepName: string) =>
  trackMetaCustom('StepCompleted', { step_number: stepIndex + 1, step_name: stepName })
