import React, { useState } from 'react';
import { ResumeProvider, useResume } from './context/ResumeContext';
import PersonalInfoForm from './components/PersonalInfoForm';
import ExperienceForm from './components/ExperienceForm';
import EducationForm from './components/EducationForm';
import SkillsForm from './components/SkillsForm';
import ResumePreview from './components/ResumePreview';
import Checkout from './pages/Checkout';
import Admin from './pages/Admin';
import { FileText, Shield, ArrowRight, Check, ChevronRight, Layout, Sparkles, Minimize } from 'lucide-react';

const ResumeBuilder = () => {
  const { resume, updateSummary, setPaymentStatus, activeTemplate, setActiveTemplate } = useResume();
  const [currentStep, setCurrentStep] = useState(0);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [currentTip, setCurrentTip] = useState('');

  const steps = [
    { title: 'Dados Pessoais', component: PersonalInfoForm, icon: '👤' },
    { title: 'Experiência', component: ExperienceForm, icon: '💼' },
    { title: 'Formação', component: EducationForm, icon: '🎓' },
    { title: 'Habilidades', component: SkillsForm, icon: '⚡' },
    { title: 'Resumo', component: null, icon: '✨' },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleStepClick = (index) => {
    setCurrentStep(index);
  };

  const handleGeneratePDF = () => {
    setShowCheckout(true);
  };

  const handlePaymentSuccess = () => {
    setPaymentStatus(true, 'mock_payment_id');
    setShowCheckout(false);
  };

  const CurrentComponent = steps[currentStep].component;

  if (showAdmin) {
    return <Admin onBack={() => setShowAdmin(false)} />;
  }

  if (showCheckout) {
    return <Checkout onBack={() => setShowCheckout(false)} onPaymentSuccess={handlePaymentSuccess} />;
  }

  return (
    <div className="h-screen overflow-hidden bg-gray-50 flex flex-col lg:flex-row">
      {/* Left Panel - Form (50%) */}
      <div className="w-full lg:w-1/2 h-full flex flex-col bg-white border-r border-gray-200">
        {/* Brand Header */}
        <div className="px-8 py-6 border-b border-gray-200 flex-shrink-0 bg-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">LS - Soluções Digitais</p>
              <h1 className="text-2xl font-bold text-gray-900">Criador de Currículos</h1>
            </div>
            {/* Template Selector */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTemplate('classic')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTemplate === 'classic'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Layout className="w-4 h-4" />
                Clássico
              </button>
              <button
                onClick={() => setActiveTemplate('modern')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTemplate === 'modern'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                Moderno
              </button>
              <button
                onClick={() => setActiveTemplate('minimalist')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTemplate === 'minimalist'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Minimize className="w-4 h-4" />
                Minimalista
              </button>
            </div>
          </div>
        </div>

        {/* Stepper */}
        <div className="px-8 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={index}>
                <button
                  onClick={() => handleStepClick(index)}
                  className={`flex flex-col items-center gap-2 transition-all duration-300 ${
                    index <= currentStep ? 'opacity-100' : 'opacity-40'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                      completedSteps.has(index)
                        ? 'bg-blue-500 text-white shadow-md'
                        : index === currentStep
                        ? 'bg-blue-600 text-white shadow-md ring-4 ring-blue-500/20'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {completedSteps.has(index) ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <span>{step.icon}</span>
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium transition-colors duration-300 ${
                      index === currentStep ? 'text-blue-600' : 'text-gray-600'
                    }`}
                  >
                    {step.title}
                  </span>
                </button>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-4 transition-all duration-500 ${
                      completedSteps.has(index) ? 'bg-blue-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Form Content with Scroll */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">{steps[currentStep].title}</h2>
            <p className="text-gray-500 text-sm">
              {currentStep === 0 && 'Preencha suas informações de contato básicas'}
              {currentStep === 1 && 'Adicione sua experiência profissional relevante'}
              {currentStep === 2 && 'Informe sua formação acadêmica'}
              {currentStep === 3 && 'Liste suas habilidades técnicas e soft skills'}
              {currentStep === 4 && 'Escreva um resumo impactante sobre você'}
            </p>
          </div>

          <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {CurrentComponent ? (
              <CurrentComponent onFocusTip={setCurrentTip} />
            ) : (
              <div className="space-y-6">
                <textarea
                  value={resume.summary}
                  onChange={(e) => updateSummary(e.target.value)}
                  onFocus={() => setCurrentTip('Escreva um parágrafo curto (3 a 4 linhas) destacando seus anos de experiência e sua maior especialidade.')}
                  placeholder="Descreva brevemente suas qualificações profissionais, objetivos de carreira e principais conquistas..."
                  rows={12}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all duration-200 resize-none text-gray-700 shadow-sm placeholder-gray-400"
                />
              </div>
            )}
          </div>

          {/* Dynamic Tips Panel */}
          {currentTip && (
            <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-blue-900 mb-1">Dica de Especialista</p>
                  <p className="text-sm text-blue-700 leading-relaxed">{currentTip}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pb-8">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className="flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-300 font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] transition-transform"
            >
              Voltar
            </button>
            <button
              onClick={handleNext}
              disabled={currentStep === steps.length - 1}
              className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-300 font-medium shadow-md disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] transition-transform"
            >
              {currentStep === steps.length - 1 ? 'Finalizar' : 'Avançar'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel - Preview (50%) */}
      <div className="w-full lg:w-1/2 h-full bg-slate-100 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-4xl">
          <ResumePreview onGeneratePDF={handleGeneratePDF} />
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <ResumeProvider>
      <ResumeBuilder />
    </ResumeProvider>
  );
}

export default App;
