'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, Sparkles } from 'lucide-react'

interface CompletionModalProps {
  isOpen: boolean
  onComplete: () => void
}

const CompletionModal = ({ isOpen, onComplete }: CompletionModalProps) => {
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    if (!isOpen) return

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          onComplete()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isOpen, onComplete])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-emerald-600/95 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-6">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <CheckCircle className="w-16 h-16 text-emerald-600" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
            <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse delay-100" />
            <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse delay-200" />
          </div>
        </div>

        <h2 className="text-4xl font-bold text-white mb-4">
          Parabéns!
        </h2>
        
        <p className="text-xl text-emerald-100 mb-8 max-w-md mx-auto leading-relaxed">
          Seu currículo foi otimizado para vencer os robôs de RH (ATS) e está pronto!
        </p>

        <div className="bg-white/20 rounded-2xl px-6 py-3 inline-block">
          <p className="text-white text-sm">
            Redirecionando em <span className="font-bold text-2xl">{countdown}</span>s...
          </p>
        </div>
      </div>
    </div>
  )
}

export default CompletionModal
