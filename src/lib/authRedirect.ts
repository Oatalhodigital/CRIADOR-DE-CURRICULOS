import { getRedirectResult, User } from 'firebase/auth'
import { auth } from './firebase'

export type RedirectOutcome =
  | { status: 'success'; user: User }
  | { status: 'none' }
  | { status: 'error'; code: string; message: string }

export const GOOGLE_LOGIN_PENDING_KEY = 'googleLoginPending'

// Se o SDK nunca resolver o evento de redirect (aba restaurada, handler do
// provedor interrompido) o app nao pode ficar preso no estado de carregamento.
const REDIRECT_RESULT_TIMEOUT_MS = 12000

let pendingOutcome: Promise<RedirectOutcome> | null = null

/**
 * Resolves the pending signInWithRedirect() result exactly once per page load.
 *
 * Both ResumeContext (which falls back to anonymous sign-in) and
 * LeadCaptureModal (which fills the form with the Google profile) need this
 * result. Calling getRedirectResult() twice, or racing it against
 * signInAnonymously(), produced intermittent failures where the anonymous
 * session overwrote the Google session. Sharing a single promise guarantees a
 * deterministic order: the redirect is always resolved before any fallback.
 *
 * This promise never rejects; failures are returned as { status: 'error' }.
 */
export function resolveRedirectOutcome(): Promise<RedirectOutcome> {
  if (!pendingOutcome) {
    pendingOutcome = (async (): Promise<RedirectOutcome> => {
      if (!auth) return { status: 'none' }

      // Se o usuário já tem uma sessão ativa, usamos ela imediatamente sem
      // precisar processar o redirect. Isso previne que carregamentos normais
      // de página sejam confundidos com cancelamento de login.
      if (auth.currentUser) {
        return { status: 'success', user: auth.currentUser }
      }

      try {
        const timeout = new Promise<RedirectOutcome>((resolve) =>
          setTimeout(
            () => resolve({ status: 'error', code: 'auth/redirect-timeout', message: 'redirect result timeout' }),
            REDIRECT_RESULT_TIMEOUT_MS
          )
        )
        const resolution = getRedirectResult(auth).then<RedirectOutcome>((result) =>
          result?.user ? { status: 'success', user: result.user } : { status: 'none' }
        )
        return await Promise.race([resolution, timeout])
      } catch (err: unknown) {
        const error = err as { code?: string; message?: string }
        return {
          status: 'error',
          code: error?.code || '',
          message: error?.message || 'unknown error',
        }
      }
    })()
  }
  return pendingOutcome
}

export function isGoogleLoginPending(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return sessionStorage.getItem(GOOGLE_LOGIN_PENDING_KEY) === '1'
  } catch {
    return false
  }
}

export function markGoogleLoginPending(): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(GOOGLE_LOGIN_PENDING_KEY, '1')
  } catch (e) {
    console.warn('[auth redirect] could not persist pending flag', e)
  }
}

export function clearGoogleLoginPending(): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(GOOGLE_LOGIN_PENDING_KEY)
  } catch {
    /* ignore */
  }
}
