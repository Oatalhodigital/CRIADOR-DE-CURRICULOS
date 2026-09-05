/**
 * Utilitários para captura e persistência do gclid (Google Click ID).
 * O gclid é adicionado à URL pelo Google Ads quando o usuário clica em um anúncio.
 * Capturamos na chegada e persistimos em sessionStorage para enviar com o lead/pedido.
 */

const GCLID_KEY = 'gclid'
const GCLID_EXPIRY_MS = 90 * 24 * 60 * 60 * 1000 // 90 dias

export function captureGclid(): void {
  if (typeof window === 'undefined') return

  const urlParams = new URLSearchParams(window.location.search)
  const gclid = urlParams.get('gclid')

  if (gclid) {
    const payload = {
      value: gclid,
      timestamp: Date.now(),
    }
    try {
      sessionStorage.setItem(GCLID_KEY, JSON.stringify(payload))
    } catch (err) {
      console.error('[gclid] failed to save to sessionStorage', err)
    }
  }
}

export function getGclid(): string | undefined {
  if (typeof window === 'undefined') return undefined

  try {
    const stored = sessionStorage.getItem(GCLID_KEY)
    if (!stored) return undefined

    const parsed = JSON.parse(stored) as { value: string; timestamp: number }
    if (Date.now() - parsed.timestamp > GCLID_EXPIRY_MS) {
      sessionStorage.removeItem(GCLID_KEY)
      return undefined
    }

    return parsed.value
  } catch {
    return undefined
  }
}
