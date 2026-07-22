'use client'

import { useEffect, useRef, useState } from 'react'
import { User, Mail, Phone, ArrowRight, Loader2 } from 'lucide-react'
import { auth } from '@/lib/firebase'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'

interface LeadCaptureModalProps {
  isOpen: boolean
  onComplete: (leadData: { name: string; email: string; whatsapp: string }) => void
}

const LeadCaptureModal = ({ isOpen, onComplete }: LeadCaptureModalProps) => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [consentMarketing, setConsentMarketing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const backgroundSave = async (payload: object, retries = 3) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)
        const response = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
          keepalive: true,
        })
        clearTimeout(timeoutId)

        if (response.ok) {
          console.log('LeadCaptureModal: background save succeeded', { attempt })
          return
        }
        console.warn('LeadCaptureModal: background save attempt failed', { status: response.status, attempt })
      } catch (err) {
        console.error('LeadCaptureModal: background save attempt error', { attempt, err })
      }

      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 2000 * attempt))
      }
    }
    console.error('LeadCaptureModal: background save exhausted retries')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name || !email || !whatsapp) {
      setError('Por favor, preencha todos os campos')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Por favor, insira um e-mail válido')
      return
    }

    setIsLoading(true)

    const payload = { name, email, whatsapp, consentMarketing }
    // Timeout de 7s no cliente (menor que o timeout server de 6s + margem de rede)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 7000)

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Erro ao salvar seus dados')
      }

      console.log('LeadCaptureModal: lead saved synchronously', { email })
      onComplete({ name, email, whatsapp })
    } catch (err) {
      clearTimeout(timeoutId)

      let userMessage = 'Salvamento demorou, mas você pode continuar. Tentaremos novamente em segundo plano.'
      if (err instanceof Error && err.name !== 'AbortError') {
        userMessage = `${err.message}. Você pode continuar; tentaremos salvar novamente.`
      }

      if (mountedRef.current) setError(userMessage)
      console.error('LeadCaptureModal: synchronous save failed, advancing user', { error: err, context: { name, email } })

      // Avança o usuário imediatamente e tenta salvar em segundo plano
      onComplete({ name, email, whatsapp })

      // Retry em segundo plano (sobrevive a desmontagem do modal graças ao keepalive)
      backgroundSave(payload, 3)
    } finally {
      if (mountedRef.current) setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    if (!auth) {
      setError('Autenticação não configurada. Verifique as variáveis de ambiente do Firebase.')
      console.error('LeadCaptureModal: Firebase auth not initialized')
      return
    }

    setGoogleLoading(true)
    setError('')
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })

    const timeoutId = setTimeout(() => {
      setGoogleLoading(false)
      setError('Tempo esgotado ao conectar com o Google. Tente novamente.')
      console.error('LeadCaptureModal: Google login timeout after 10s')
    }, 10000)

    try {
      const credential = await Promise.race([
        signInWithPopup(auth, provider),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Firebase auth timeout')), 10000)
        ),
      ])

      clearTimeout(timeoutId)

      if (credential && 'user' in credential) {
        setName(credential.user.displayName || name)
        setEmail(credential.user.email || email)
      }
    } catch (err: any) {
      clearTimeout(timeoutId)
      const code = err?.code || ''
      const message = err?.message || ''

      let userMessage = 'Erro ao fazer login com Google. Tente novamente.'
      if (code === 'auth/unauthorized-domain') {
        userMessage = 'Este domínio não está autorizado no Firebase Auth. Verifique os domínios autorizados no Console do Firebase.'
      } else if (
        code === 'auth/configuration-not-found' ||
        code === 'auth/operation-not-allowed' ||
        code === 'auth/popup-closed-by-user'
      ) {
        userMessage =
          'Login com Google não está habilitado ou foi cancelado. Verifique o Console do Firebase.'
      } else if (
        code === 'auth/web-storage-unsupported' ||
        code === 'auth/storage-unsupported'
      ) {
        userMessage = 'Cookies ou armazenamento local estão desabilitados. Habilite-os para fazer login com o Google.'
      } else if (code === 'auth/popup-blocked' || code === 'auth/popup-closed-by-user') {
        userMessage = 'Popup de login bloqueado ou fechado. Permitua popups para este site.'
      } else if (message.includes('timeout')) {
        userMessage = 'Tempo esgotado ao conectar com o Google. Tente novamente.'
      }

      setError(userMessage)
      console.error('LeadCaptureModal: Google login error', { code, message, timestamp: new Date().toISOString() })
    } finally {
      setGoogleLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-emerald-900/95 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Vamos Começar!
          </h2>
          <p className="text-gray-600">
            Informe seus dados para criar seu currículo otimizado por IA
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" aria-label="Formulário de cadastro">
          <div className="space-y-2">
            <label htmlFor="lead-name" className="block text-sm font-semibold text-gray-900">Nome Completo</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
              <input
                id="lead-name"
                name="lead-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome completo"
                aria-required="true"
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={error ? 'lead-error' : undefined}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none transition-all duration-200 text-gray-900 placeholder-gray-400"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="lead-email" className="block text-sm font-semibold text-gray-900">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
              <input
                id="lead-email"
                name="lead-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                aria-required="true"
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={error ? 'lead-error' : undefined}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none transition-all duration-200 text-gray-900 placeholder-gray-400"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="lead-whatsapp" className="block text-sm font-semibold text-gray-900">WhatsApp</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
              <input
                id="lead-whatsapp"
                name="lead-whatsapp"
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="(00) 00000-0000"
                aria-required="true"
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={error ? 'lead-error' : undefined}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none transition-all duration-200 text-gray-900 placeholder-gray-400"
              />
            </div>
          </div>

          {error && (
            <div id="lead-error" role="alert" className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={consentMarketing}
              onChange={(e) => setConsentMarketing(e.target.checked)}
              className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-600 focus:ring-offset-0 mt-0.5 flex-shrink-0"
            />
            <span className="text-xs text-gray-600 leading-relaxed">
              Concordo em receber comunicações por e-mail sobre o serviço, incluindo lembretes e dicas para melhorar meu currículo. 
              <a href="/politica-privacidade" className="text-emerald-600 hover:underline ml-1">
                Ver Política de Privacidade
              </a>
            </span>
          </label>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-emerald-600 text-white py-4 rounded-xl font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                Continuar
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">ou</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            aria-busy={googleLoading}
            className="w-full bg-white border-2 border-gray-200 text-gray-900 py-4 rounded-xl font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {googleLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Entrar com Google</span>
          </>
        )}
        </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-6">
          Ao continuar, você concorda com nossos Termos de Uso e Política de Privacidade
        </p>
      </div>
    </div>
  )
}

export default LeadCaptureModal
