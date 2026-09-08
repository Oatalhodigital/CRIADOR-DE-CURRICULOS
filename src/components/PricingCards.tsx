'use client'

import { useState } from 'react'
import { Check, Crown, FileText } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

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

const formatPrice = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

const PricingCards = ({ onSelectPlan }: PricingCardsProps) => {
  const { t } = useLanguage()

  const plans: Plan[] = [
    {
      id: 'single',
      name: t('pricing.basic'),
      price: 7.90,
      description: t('pricing.basicDesc'),
      features: [`1 ${t('pricing.featurePdfSingular')}`, t('pricing.featureAts'), t('pricing.featureDays')],
    },
    {
      id: 'weekly',
      name: t('pricing.intermediate'),
      price: 12.49,
      description: t('pricing.intermediateDesc'),
      features: [`2 ${t('pricing.featurePdf')}`, t('pricing.featureAts'), t('pricing.featureDays')],
      highlighted: true,
      badge: t('pricing.badgeBestSeller'),
    },
    {
      id: 'monthly',
      name: t('pricing.complete'),
      price: 17.90,
      description: t('pricing.completeDesc'),
      features: [`3 ${t('pricing.featurePdf')}`, t('pricing.featureAts'), t('pricing.featureDays')],
    },
  ]

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">{t('pricing.title')}</h2>
        <p className="text-gray-600">{t('pricing.subtitle')}</p>
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
              {t('pricing.select')}
            </button>
          </div>
        ))}
      </div>

      <div className="text-center text-sm text-gray-500 mt-6">
        <p>{t('pricing.securePayment')}</p>
      </div>
    </div>
  )
}

export default PricingCards
