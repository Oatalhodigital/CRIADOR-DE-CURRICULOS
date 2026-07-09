import React, { useState } from 'react';
import { ResumeProvider, useResume } from './context/ResumeContext';
import PersonalInfoForm from './components/PersonalInfoForm';
import ExperienceForm from './components/ExperienceForm';
import EducationForm from './components/EducationForm';
import SkillsForm from './components/SkillsForm';
import ResumePreview from './components/ResumePreview';
import Checkout from './pages/Checkout';
import Admin from './pages/Admin';
import { FileText, Shield, ArrowRight, Check, ChevronRight } from 'lucide-react';

const ResumeBuilder = () => {
  const { resume, updateSummary, setPaymentStatus } = useResume();
  const [currentStep, setCurrentStep] = useState(0);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

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

  const handleStepClick = (index: number) => {
    if (completedSteps.has(index) || index < currentStep) {
      setCurrentStep(index);
    }
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
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 overflow-hidden">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-6 py-4 flex-shrink-0 z-50">
        <div className="flex justify-between items-center max-w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">LS Currículos</h1>
              <p className="text-xs text-gray-500 font-medium">Soluções Digitais</p>
            </div>
          </div>
          <button
            onClick={() => setShowAdmin(true)}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-300 font-medium text-sm"
          >
            <Shield className="w-4 h-4" />
            Admin
          </button>
        </div>
      </header>

      {/* Split Screen Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Form (50%) */}
        <div className="w-1/2 flex flex-col bg-white/50 backdrop-blur-sm border-r border-gray-200/50">
          {/* Stepper */}
          <div className="px-8 py-6 flex-shrink-0">
            <div className="flex items-center justify-between mb-6">
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
                          ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                          : index === currentStep
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 ring-4 ring-indigo-500/20'
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
                        index === currentStep ? 'text-indigo-600' : 'text-gray-600'
                      }`}
                    >
                      {step.title}
                    </span>
                  </button>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-4 transition-all duration-500 ${
                        completedSteps.has(index) ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Form Content with Scroll */}
          <div className="flex-1 overflow-y-auto px-8 pb-8">
            <div className="max-w-2xl mx-auto">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{steps[currentStep].title}</h2>
                <p className="text-gray-500 text-sm">
                  {currentStep === 0 && 'Preencha suas informações de contato básicas'}
                  {currentStep === 1 && 'Adicione sua experiência profissional relevante'}
                  {currentStep === 2 && 'Informe sua formação acadêmica'}
                  {currentStep === 3 && 'Liste suas habilidades técnicas e soft skills'}
                  {currentStep === 4 && 'Escreva um resumo impactante sobre você'}
                </p>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200/50">
                {CurrentComponent ? (
                  <CurrentComponent />
                ) : (
                  <div className="space-y-6">
                    <textarea
                      value={resume.summary}
                      onChange={(e) => updateSummary(e.target.value)}
                      placeholder="Descreva brevemente suas qualificações profissionais, objetivos de carreira e principais conquistas..."
                      rows={12}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all duration-300 resize-none text-gray-900 placeholder-gray-400"
                    />
                  </div>
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center mt-8">
                <button
                  onClick={handleBack}
                  disabled={currentStep === 0}
                  className="flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-300 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Voltar
                </button>
                <button
                  onClick={handleNext}
                  disabled={currentStep === steps.length - 1}
                  className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-medium shadow-lg shadow-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {currentStep === steps.length - 1 ? 'Finalizar' : 'Avançar'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Preview (50%) */}
        <div className="w-1/2 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-8 overflow-hidden">
          <div className="w-full max-w-2xl">
            <ResumePreview onGeneratePDF={handleGeneratePDF} />
          </div>
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
