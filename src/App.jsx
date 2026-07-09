import React, { useState } from 'react';
import { ResumeProvider, useResume } from './context/ResumeContext';
import ResumePreview from './components/ResumePreview';
import { FileText, ArrowRight, ArrowLeft, Download, Check } from 'lucide-react';

const ResumeBuilder = () => {
  const { resume, updatePersonalInfo, updateSummary } = useResume();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    targetRole: '',
    email: '',
    phone: '',
    location: '',
    professionalTrajectory: ''
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    updatePersonalInfo({
      ...resume.personalInfo,
      [field]: value
    });
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleExport = () => {
    window.print();
  };

  const steps = [
    { id: 1, title: 'Contato' },
    { id: 2, title: 'Trajetória' },
    { id: 3, title: 'Exportar' }
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-deep)' }}>
      {/* Header */}
      <header className="px-8 py-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs font-semibold tracking-wider mb-1" style={{ color: 'var(--neon-blue)' }}>
              LEANDRO SENA | LS - Soluções Digitais
            </p>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-white)' }}>
              Criador de Currículos
            </h1>
          </div>
        </div>
      </header>

      {/* Stepper */}
      <div className="px-8 py-6">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                    currentStep >= step.id
                      ? 'shadow-lg'
                      : 'opacity-40'
                  }`}
                  style={{
                    backgroundColor: currentStep >= step.id ? 'var(--neon-blue)' : 'var(--bg-card)',
                    color: currentStep >= step.id ? 'var(--bg-deep)' : 'var(--text-muted)',
                    boxShadow: currentStep >= step.id ? '0 0 20px rgba(0, 229, 255, 0.3)' : 'none'
                  }}
                >
                  {currentStep > step.id ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    step.id
                  )}
                </div>
                <span
                  className="text-xs font-medium"
                  style={{
                    color: currentStep >= step.id ? 'var(--text-white)' : 'var(--text-muted)'
                  }}
                >
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className="flex-1 h-0.5 mx-4 transition-all"
                  style={{
                    backgroundColor: currentStep > step.id ? 'var(--neon-blue)' : 'var(--border-color)',
                    boxShadow: currentStep > step.id ? '0 0 10px rgba(0, 229, 255, 0.3)' : 'none'
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Main Content - Split View */}
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-200px)]">
        {/* Left Panel - Form */}
        <div className="w-full lg:w-1/2 p-8 overflow-y-auto">
          <div
            className="rounded-2xl p-8 border"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)'
            }}
          >
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-white)' }}>
                  Informações de Contato
                </h2>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    placeholder="Seu nome completo"
                    className="w-full px-4 py-3 rounded-xl border outline-none transition-all"
                    style={{
                      backgroundColor: 'var(--bg-deep)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-white)'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--neon-blue)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
                    Cargo Alvo
                  </label>
                  <input
                    type="text"
                    value={formData.targetRole}
                    onChange={(e) => handleInputChange('targetRole', e.target.value)}
                    placeholder="Ex: Desenvolvedor Front-end Senior"
                    className="w-full px-4 py-3 rounded-xl border outline-none transition-all"
                    style={{
                      backgroundColor: 'var(--bg-deep)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-white)'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--neon-blue)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
                      E-mail
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full px-4 py-3 rounded-xl border outline-none transition-all"
                      style={{
                        backgroundColor: 'var(--bg-deep)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-white)'
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'var(--neon-blue)'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
                      Telefone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="(00) 00000-0000"
                      className="w-full px-4 py-3 rounded-xl border outline-none transition-all"
                      style={{
                        backgroundColor: 'var(--bg-deep)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-white)'
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'var(--neon-blue)'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
                    Localização
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="Cidade, Estado"
                    className="w-full px-4 py-3 rounded-xl border outline-none transition-all"
                    style={{
                      backgroundColor: 'var(--bg-deep)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-white)'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--neon-blue)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                  />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-white)' }}>
                  Trajetória Profissional
                </h2>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
                    Resumo Profissional
                  </label>
                  <textarea
                    value={formData.professionalTrajectory}
                    onChange={(e) => handleInputChange('professionalTrajectory', e.target.value)}
                    placeholder="Descreva sua experiência profissional, principais conquistas e objetivos de carreira..."
                    rows={12}
                    className="w-full px-4 py-3 rounded-xl border outline-none transition-all resize-none"
                    style={{
                      backgroundColor: 'var(--bg-deep)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-white)'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--neon-blue)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                  />
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-white)' }}>
                  Visualização e Exportação
                </h2>
                
                <div className="p-6 rounded-xl border" style={{ borderColor: 'var(--border-color)' }}>
                  <p className="mb-4" style={{ color: 'var(--text-muted)' }}>
                    Seu currículo está pronto para exportação. Revise o preview ao lado e clique no botão abaixo para gerar o PDF.
                  </p>
                  <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-8 py-4 rounded-xl font-semibold transition-all hover:scale-105"
                    style={{
                      backgroundColor: 'var(--neon-green)',
                      color: 'var(--bg-deep)',
                      boxShadow: '0 0 20px rgba(0, 230, 118, 0.3)'
                    }}
                  >
                    <Download className="w-5 h-5" />
                    Exportar em PDF
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-8">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105"
              style={{
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-white)',
                borderColor: 'var(--border-color)'
              }}
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
            <button
              onClick={handleNext}
              disabled={currentStep === 3}
              className="flex items-center gap-2 px-8 py-3 rounded-xl font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105"
              style={{
                backgroundColor: currentStep === 3 ? 'var(--bg-card)' : 'var(--neon-blue)',
                color: currentStep === 3 ? 'var(--text-muted)' : 'var(--bg-deep)',
                boxShadow: currentStep === 3 ? 'none' : '0 0 20px rgba(0, 229, 255, 0.3)'
              }}
            >
              {currentStep === 3 ? 'Concluído' : 'Avançar'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="w-full lg:w-1/2 p-8 flex items-center justify-center overflow-y-auto">
          <div className="resume-print-container w-full max-w-4xl">
            <ResumePreview />
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
