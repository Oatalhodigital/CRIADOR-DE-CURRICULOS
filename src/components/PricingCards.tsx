'use client'

import { useState } from 'react'
import { Check, Crown, FileText } from 'lucide-react'

interface PricingCardsProps {
  onSelectPlan: (plan: 'single' | 'weekly' | 'monthly', includeCoverLetter?: boolean) => void
}

const PricingCards = ({ onSelectPlan }: PricingCardsProps) => {
  const [includeCoverLetter, setIncludeCoverLetter] = useState(false)

  const handleSelectPlan = (plan: 'single' | 'weekly' | 'monthly') => {
    onSelectPlan(plan, plan === 'monthly' ? includeCoverLetter : false)
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Escolha seu Plano</h2>
        <p className="text-gray-600">Desbloqueie seu currículo otimizado por IA</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CARD 1: Acesso Único */}
        <div
          onClick={() => handleSelectPlan('single')}
          className="relative bg-white border-2 border-gray-200 rounded-2xl p-6 cursor-pointer hover:border-emerald-400 hover:shadow-xl transition-all duration-300 group"
        >
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Acesso Único</h3>
            <div className="mb-4">
              <span className="text-4xl font-bold text-gray-900">R$ 7,98</span>
            </div>
            <p className="text-sm text-gray-600 mb-6">Criação de 1 currículo otimizado</p>
          </div>
          <ul className="space-y-3 mb-6">
            <li className="flex items-center gap-3 text-sm text-gray-700">
              <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>1 currículo otimizado por IA</span>
            </li>
            <li className="flex items-center gap-3 text-sm text-gray-700">
              <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>Download em PDF</span>
            </li>
            <li className="flex items-center gap-3 text-sm text-gray-700">
              <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>Otimização ATS</span>
            </li>
          </ul>
          <button className="w-full py-3 bg-gray-100 text-gray-900 rounded-xl font-semibold hover:bg-gray-200 transition-colors group-hover:bg-emerald-50 group-hover:text-emerald-700">
            Selecionar
          </button>
        </div>

        {/* CARD 2: Passaporte Semanal */}
        <div
          onClick={() => handleSelectPlan('weekly')}
          className="relative bg-white border-2 border-gray-200 rounded-2xl p-6 cursor-pointer hover:border-emerald-400 hover:shadow-xl transition-all duration-300 group"
        >
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Passaporte Semanal</h3>
            <div className="mb-4">
              <span className="text-4xl font-bold text-gray-900">R$ 10,49</span>
            </div>
            <p className="text-sm text-gray-600 mb-6">Até 3 currículos em 7 dias</p>
          </div>
          <ul className="space-y-3 mb-6">
            <li className="flex items-center gap-3 text-sm text-gray-700">
              <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>Até 3 currículos otimizados</span>
            </li>
            <li className="flex items-center gap-3 text-sm text-gray-700">
              <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>Válido por 7 dias</span>
            </li>
            <li className="flex items-center gap-3 text-sm text-gray-700">
              <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>Download ilimitado</span>
            </li>
          </ul>
          <button className="w-full py-3 bg-gray-100 text-gray-900 rounded-xl font-semibold hover:bg-gray-200 transition-colors group-hover:bg-emerald-50 group-hover:text-emerald-700">
            Selecionar
          </button>
        </div>

        {/* CARD 3: Passaporte Mensal (FEATURED) */}
        <div
          onClick={() => handleSelectPlan('monthly')}
          className="relative bg-white border-2 border-emerald-600 rounded-2xl p-6 cursor-pointer shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
        >
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <div className="bg-emerald-600 text-white px-4 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              <Crown className="w-3 h-3" />
              MAIS VENDIDO
            </div>
          </div>
          <div className="text-center pt-2">
            <h3 className="text-xl font-bold text-emerald-600 mb-2">Passaporte Mensal</h3>
            <div className="mb-4">
              <span className="text-4xl font-bold text-emerald-600">R$ 12,49</span>
            </div>
            <p className="text-sm text-gray-600 mb-6">Até 5 currículos em 30 dias</p>
          </div>
          <ul className="space-y-3 mb-6">
            <li className="flex items-center gap-3 text-sm text-gray-700">
              <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>Até 5 currículos otimizados</span>
            </li>
            <li className="flex items-center gap-3 text-sm text-gray-700">
              <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>Válido por 30 dias</span>
            </li>
            <li className="flex items-center gap-3 text-sm text-gray-700">
              <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>Download ilimitado</span>
            </li>
            <li className="flex items-center gap-3 text-sm text-gray-700">
              <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>Suporte prioritário</span>
            </li>
          </ul>

          {/* Upsell: Carta de Apresentação */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeCoverLetter}
                onChange={(e) => {
                  e.stopPropagation()
                  setIncludeCoverLetter(e.target.checked)
                }}
                className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-600 focus:ring-offset-0 mt-0.5"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-semibold text-gray-900">
                    + Carta de Apresentação Otimizada
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Modelo extra de carta personalizada por IA (+R$ 4,90)
                </p>
              </div>
            </label>
          </div>

          <button className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/30">
            Selecionar
          </button>
        </div>
      </div>

      <div className="text-center text-sm text-gray-500 mt-6">
        <p>Pagamento seguro via PIX • Sem assinaturas ocultas</p>
      </div>
    </div>
  )
}

export default PricingCards
