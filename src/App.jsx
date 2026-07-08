import React, { useState } from 'react';
import { ResumeProvider, useResume } from './context/ResumeContext';
import PersonalInfoForm from './components/PersonalInfoForm';
import ExperienceForm from './components/ExperienceForm';
import EducationForm from './components/EducationForm';
import SkillsForm from './components/SkillsForm';
import ResumePreview from './components/ResumePreview';
import Checkout from './pages/Checkout';
import Admin from './pages/Admin';
import { FileText, Layout, Shield } from 'lucide-react';

const ResumeBuilder: React.FC = () => {
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileText className="w-8 h-8 text-purple-600" />
            <h1 className="text-2xl font-bold text-gray-900">Gerador de Currículos</h1>
          </div>
          <button
            onClick={() => setShowAdmin(true)}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
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
            {/* Step Indicator */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <Layout className="w-5 h-5 text-purple-600" />
                <h2 className="font-semibold text-gray-900">Progresso</h2>
              </div>
              <div className="flex gap-2">
                {steps.map((step, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentStep(index)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                      currentStep === index
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {step.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Form Content */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              {CurrentComponent ? (
                <CurrentComponent />
              ) : (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-800">Resumo Profissional</h2>
                  <textarea
                    value={resume.summary}
                    onChange={(e) => updateSummary(e.target.value)}
                    placeholder="Escreva um breve resumo sobre suas qualificações e objetivos profissionais..."
                    rows={8}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition resize-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="lg:sticky lg:top-8 lg:self-start">
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
