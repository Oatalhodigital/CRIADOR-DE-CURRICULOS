import React, { useState } from 'react';
import { ResumeProvider, useResume } from './context/ResumeContext';
import PersonalInfoForm from './components/PersonalInfoForm';
import ExperienceForm from './components/ExperienceForm';
import EducationForm from './components/EducationForm';
import SkillsForm from './components/SkillsForm';
import ResumePreview from './components/ResumePreview';
import ProgressBar from './components/ProgressBar';
import Checkout from './pages/Checkout';
import Admin from './pages/Admin';
import { FileText, Shield, Sparkles } from 'lucide-react';

const ResumeBuilder = () => {
  const { resume, updateSummary, setPaymentStatus } = useResume();
  const [currentStep, setCurrentStep] = useState(0);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  const steps = [
    { title: 'Dados Pessoais', component: PersonalInfoForm },
    { title: 'Experiência', component: ExperienceForm },
    { title: 'Formação', component: EducationForm },
    { title: 'Habilidades', component: SkillsForm },
    { title: 'Resumo', component: null },
  ];

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                LS Currículos
              </h1>
              <p className="text-xs text-gray-500">Soluções Digitais Premium</p>
            </div>
          </div>
          <button
            onClick={() => setShowAdmin(true)}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all duration-300 font-medium"
          >
            <Shield className="w-5 h-5" />
            Admin
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel - Form */}
          <div className="space-y-6">
            {/* Progress Bar */}
            <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h2 className="font-semibold text-gray-900">Seu Progresso</h2>
              </div>
              <ProgressBar currentStep={currentStep} totalSteps={steps.length} />
              
              {/* Step Navigation */}
              <div className="flex gap-2 mt-6">
                {steps.map((step, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentStep(index)}
                    className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                      currentStep === index
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {step.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Form Content */}
            <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
              {CurrentComponent ? (
                <CurrentComponent />
              ) : (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-purple-600" />
                    Resumo Profissional
                  </h2>
                  <textarea
                    value={resume.summary}
                    onChange={(e) => updateSummary(e.target.value)}
                    placeholder="Escreva um breve resumo sobre suas qualificações e objetivos profissionais..."
                    rows={8}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 resize-none bg-gray-50 focus:bg-white"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <ResumePreview onGeneratePDF={handleGeneratePDF} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-lg border-t border-gray-200 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-600 text-sm">
          <p>© 2026 LS Soluções Digitais. Todos os direitos reservados.</p>
        </div>
      </footer>
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
