'use client'

import { useState } from 'react'
import { Check, Crown, FileText } from 'lucide-react'

type PlanId = 'single' | 'weekly' | 'monthly'

interface PricingCardsProps {
  onSelectPlan: (plan: PlanId) => void
}

interface Plan {
  id: PlanId
  name: string
  price: number
  description: string
  features: string[]
  highlighted?: boolean
  badge?: string
}

const plans: Plan[] = [
  {
    id: 'single',
    name: 'Básico',
    price: 7.90,
    description: '1 download do currículo',
    features: ['1 download do currículo em PDF', 'Layout 100% ATS-friendly', 'Download disponível por 30 dias'],
  },
  {
    id: 'weekly',
    name: 'Intermediário',
    price: 12.49,
    description: '2 downloads do currículo',
    features: ['2 downloads do currículo em PDF', 'Layout 100% ATS-friendly', 'Downloads disponíveis por 30 dias'],
    highlighted: true,
    badge: 'MAIS VENDIDO',
  },
  {
    id: 'monthly',
    name: 'Completo',
    price: 17.90,
    description: '3 downloads do currículo',
    features: ['3 downloads do currículo em PDF', 'Layout 100% ATS-friendly', 'Downloads disponíveis por 30 dias'],
  },
]

const formatPrice = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

const PricingCards = ({ onSelectPlan }: PricingCardsProps) => {

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Escolha seu Plano</h2>
        <p className="text-gray-600">Desbloqueie seu currículo otimizado por IA</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            onClick={() => onSelectPlan(plan.id)}
            className={`relative rounded-2xl p-6 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 ${
              plan.highlighted
                ? 'bg-white border-2 border-emerald-600 shadow-xl hover:shadow-2xl'
                : 'bg-white border-2 border-gray-200 hover:border-emerald-400 hover:shadow-xl'
            }`}
          >
            {plan.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <div className="bg-emerald-600 text-white px-4 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  {plan.badge}
                </div>
              </div>
            )}
            <div className={`text-center ${plan.highlighted ? 'pt-2' : ''}`}>
              <h3 className={`text-xl font-bold mb-2 ${plan.highlighted ? 'text-emerald-600' : 'text-gray-900'}`}>
                {plan.name}
              </h3>
              <div className="mb-4">
                <span className={`text-4xl font-bold ${plan.highlighted ? 'text-emerald-600' : 'text-gray-900'}`}>
                  {formatPrice(plan.price)}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-6">{plan.description}</p>
            </div>
            <ul className="space-y-3 mb-6">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-center gap-3 text-sm text-gray-700">
                  <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <button
              className={`w-full py-3 rounded-xl font-semibold transition-colors ${
                plan.highlighted
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/30'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              }`}
            >
              Selecionar
            </button>
          </div>
        ))}
      </div>

      <div className="text-center text-sm text-gray-500 mt-6">
        <p>Pagamento seguro via PIX ou Cartão • Sem assinaturas ocultas</p>
      </div>
    </div>
  )
}

export default PricingCards
