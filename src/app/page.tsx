'use client'

import { useState, useEffect } from 'react'
import { useResume } from '@/context/ResumeContext'
import { useLanguage } from '@/context/LanguageContext'
import LanguageSelector from '@/components/LanguageSelector'
import PersonalInfoForm from '@/components/PersonalInfoForm'
import ExperienceForm from '@/components/ExperienceForm'
import EducationForm from '@/components/EducationForm'
import SkillsForm from '@/components/SkillsForm'
import LanguagesForm from '@/components/LanguagesForm'
import SummaryForm from '@/components/SummaryForm'
import ResumePreview from '@/components/ResumePreview'
import LandingPage from '@/components/LandingPage'
import PricingCards from '@/components/PricingCards'
import CompletionModal from '@/components/CompletionModal'
import LeadCaptureModal from '@/components/LeadCaptureModal'
import CheckoutModal from '@/components/CheckoutModal'
import { User, Briefcase, GraduationCap, Zap, FileText, ArrowRight, ArrowLeft, CreditCard, Globe } from 'lucide-react'

type Step = 'personal' | 'experience' | 'education' | 'skills' | 'languages' | 'summary' | 'preview' | 'pricing'

const useTranslatedSteps = () => {
  const { t } = useLanguage();
  return [
    { id: 'personal' as Step, label: t('steps.personal'), icon: User },
    { id: 'experience' as Step, label: t('steps.experience'), icon: Briefcase },
    { id: 'education' as Step, label: t('steps.education'), icon: GraduationCap },
    { id: 'skills' as Step, label: t('steps.skills'), icon: Zap },
    { id: 'languages' as Step, label: t('steps.languages'), icon: Globe },
    { id: 'summary' as Step, label: t('steps.summary'), icon: FileText },
    { id: 'preview' as Step, label: t('steps.preview'), icon: FileText },
    { id: 'pricing' as Step, label: t('steps.pricing'), icon: CreditCard },
  ];
};

export default function Home() {
  const { t } = useLanguage()
  const steps = useTranslatedSteps()
  const { resume, updatePersonalInfo, draftExperience, draftEducation, draftSkill, saveStatus, setPaymentStatus } = useResume()
  const [currentStep, setCurrentStep] = useState<Step>('personal')
  const [showLanding, setShowLanding] = useState(true)
  const [showCompletion, setShowCompletion] = useState(false)
  const [showLeadCapture, setShowLeadCapture] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<'single' | 'weekly' | 'monthly' | null>(null)
  const [checkoutAmount, setCheckoutAmount] = useState(0)
  const [isPaid, setIsPaid] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)

  const handleStart = () => {
    setShowLanding(false)
  }

  const handleLeadCaptureComplete = (leadData: { name: string; email: string; whatsapp: string }) => {
    setShowLeadCapture(false)
    updatePersonalInfo({
      ...resume.personalInfo,
      fullName: leadData.name,
      email: leadData.email,
      phone: leadData.whatsapp,
    })
  }

  const currentStepIndex = steps.findIndex(s => s.id === currentStep)
  const canGoNext = currentStepIndex < steps.length - 1
  const canGoBack = currentStepIndex > 0

  const handleNext = () => {
    if (canGoNext) {
      if (currentStep === 'preview') {
        setCurrentStep('pricing')
      } else {
        setCurrentStep(steps[currentStepIndex + 1].id)
      }
    }
  }

  const handleBack = () => {
    if (canGoBack) {
      setCurrentStep(steps[currentStepIndex - 1].id)
    }
  }

  const handleCompletionComplete = () => {
    setShowCompletion(false)
    setCurrentStep('pricing')
  }

  const getPlanAmount = (plan: 'single' | 'weekly' | 'monthly') => {
    return { single: 7.90, weekly: 12.49, monthly: 17.90 }[plan] ?? 0
  }

  const handleSelectPlan = (plan: 'single' | 'weekly' | 'monthly') => {
    setSelectedPlan(plan)
    setCheckoutAmount(getPlanAmount(plan))
    setShowCheckout(true)
  }

  const handlePaymentSuccess = (paymentId?: string) => {
    setIsPaid(true)
    setShowCheckout(true)
    if (paymentId) {
      setPaymentStatus(true, paymentId)
    }
  }

  // Handle return from Mercado Pago Checkout Pro after card payment
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const status = params.get('payment_status')
    const paymentId = params.get('payment_id')

    if (status === 'approved' && paymentId) {
      handlePaymentSuccess(paymentId)
    }
  }, [])

  const renderForm = () => {
    switch (currentStep) {
      case 'personal':
        return <PersonalInfoForm />
      case 'experience':
        return <ExperienceForm />
      case 'education':
        return <EducationForm />
      case 'skills':
        return <SkillsForm />
      case 'languages':
        return <LanguagesForm />
      case 'summary':
        return <SummaryForm />
      case 'preview':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('steps.preview')}</h2>
            <p className="text-gray-600 mb-6">
              Revise seu currículo no painel ao lado. Quando estiver satisfeito, clique em {t('common.next')} para finalizar.
            </p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={handleBack}
                className="px-6 py-3 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 inline mr-2" />
                {t('common.back')}
              </button>
              <button
                onClick={handleNext}
                className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold"
              >
                {t('common.next')}
                <ArrowRight className="w-4 h-4 inline ml-2" />
              </button>
            </div>
          </div>
        )
      case 'pricing':
        return <PricingCards onSelectPlan={handleSelectPlan} />
      default:
        return null
    }
  }

  if (showLanding) {
    return <LandingPage onStart={handleStart} />
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4 grid grid-cols-3 items-center">
          <p className="text-xs font-semibold tracking-wider text-emerald-600">
            LS - Soluções Digitais
          </p>
          <h1 className="text-center text-sm md:text-base font-bold text-gray-900 uppercase tracking-tight">
            CRIADOR-DE-CURRICULOS- HELP IA
          </h1>
          <div className="flex justify-end items-center gap-3 text-sm text-gray-600">
            {saveStatus === 'saving' && <span className="text-emerald-600 animate-pulse">{t('common.loading')}</span>}
            {saveStatus === 'saved' && <span className="text-emerald-600">{t('common.saved') || 'Salvo'}</span>}
            {saveStatus === 'error' && <span className="text-red-500">{t('common.error') || 'Erro'}</span>}
            <LanguageSelector />
            <span>Etapa {currentStepIndex + 1} de {steps.length}</span>
          </div>
        </div>
      </header>

      {/* Main Content - Split Screen */}
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-73px)]">
        {/* Left Panel - Form */}
        <div className="w-full lg:w-1/2 p-6 lg:p-8 overflow-y-auto border-r border-gray-200 bg-gray-50">
          <div className="max-w-2xl mx-auto">
            {/* Step Navigation */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                {steps.map((step, index) => {
                  const Icon = step.icon
                  const isActive = step.id === currentStep
                  const isCompleted = index < currentStepIndex
                  
                  return (
                    <div key={step.id} className="flex items-center">
                      <div className="flex flex-col items-center">
                        <button
                          onClick={() => setCurrentStep(step.id)}
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                            isActive
                              ? 'bg-emerald-600 text-white'
                              : isCompleted
                              ? 'bg-emerald-100 text-emerald-600'
                              : 'bg-gray-200 text-gray-500'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </button>
                        <span className={`text-xs mt-2 ${isActive ? 'text-emerald-600 font-semibold' : 'text-gray-500'}`}>
                          {step.label}
                        </span>
                      </div>
                      {index < steps.length - 1 && (
                        <div className={`w-12 h-px mx-2 ${isCompleted ? 'bg-emerald-600' : 'bg-gray-300'}`} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Form Content */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              {renderForm()}
            </div>

            {/* Navigation Buttons */}
            {currentStep !== 'preview' && currentStep !== 'pricing' && (
              <div className="flex justify-between items-center mt-6">
                <button
                  onClick={handleBack}
                  disabled={!canGoBack}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t('common.back')}
                </button>
                <button
                  onClick={handleNext}
                  disabled={!canGoNext}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  {currentStep === 'summary' ? t('steps.preview') : t('common.next')}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Live Preview */}
        <div className="w-full lg:w-1/2 p-6 lg:p-8 overflow-y-auto bg-gray-100">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8" style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)' }}>
              <ResumePreview 
                resume={resume} 
                draftExperience={draftExperience}
                draftEducation={draftEducation}
                draftSkill={draftSkill}
                isPaid={isPaid}
                price={checkoutAmount}
                onContinueToPayment={() => setCurrentStep('pricing')}
                paymentId={resume.paymentId}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Completion Modal */}
      <CompletionModal isOpen={showCompletion} onComplete={handleCompletionComplete} />

      {/* Lead Capture Modal */}
      <LeadCaptureModal isOpen={showLeadCapture} onComplete={handleLeadCaptureComplete} />

      {/* Checkout Modal */}
      <CheckoutModal 
        isOpen={showCheckout} 
        onClose={() => setShowCheckout(false)}
        onPaymentSuccess={handlePaymentSuccess}
        amount={checkoutAmount}
        plan={selectedPlan || undefined}
      />
    </div>
  )
}
