import React, { useState } from 'react';
import ResumePreview from './components/ResumePreview';
import { ArrowRight, ArrowLeft, Download } from 'lucide-react';

const App = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [resumeData, setResumeData] = useState({
    nome: '',
    cargo: '',
    email: '',
    telefone: '',
    cidade: '',
    experiencia: ''
  });

  const handleInputChange = (field, value) => {
    setResumeData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < 2) {
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

  return (
    <div className="min-h-screen bg-[#0B0F19]">
      {/* Header */}
      <header className="px-8 py-6 border-b border-[#1E293B] print:hidden">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs font-semibold tracking-wider mb-1 text-[#00E5FF]">
              LEANDRO SENA | LS - Soluções Digitais
            </p>
            <h1 className="text-2xl font-bold text-white">
              Criador de Currículos
            </h1>
          </div>
        </div>
      </header>

      {/* Stepper */}
      <div className="px-8 py-6 print:hidden">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {[1, 2].map((step) => (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                    currentStep >= step ? 'shadow-lg' : 'opacity-40'
                  }`}
                  style={{
                    backgroundColor: currentStep >= step ? '#00E5FF' : '#111827',
                    color: currentStep >= step ? '#0B0F19' : '#94A3B8',
                    boxShadow: currentStep >= step ? '0 0 20px rgba(0, 229, 255, 0.3)' : 'none'
                  }}
                >
                  {step}
                </div>
                <span
                  className="text-xs font-medium"
                  style={{
                    color: currentStep >= step ? '#FFFFFF' : '#94A3B8'
                  }}
                >
                  {step === 1 ? 'Dados Pessoais' : 'Experiência'}
                </span>
              </div>
              {step < 2 && (
                <div
                  className="flex-1 h-0.5 mx-4 transition-all"
                  style={{
                    backgroundColor: currentStep > step ? '#00E5FF' : '#1E293B',
                    boxShadow: currentStep > step ? '0 0 10px rgba(0, 229, 255, 0.3)' : 'none'
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
        <div className="w-full lg:w-1/2 p-8 overflow-y-auto print:hidden">
          <div className="rounded-2xl p-8 border border-[#1E293B] bg-[#111827]">
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-bold mb-6 text-white">
                  Informações Pessoais
                </h2>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-[#94A3B8]">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={resumeData.nome}
                    onChange={(e) => handleInputChange('nome', e.target.value)}
                    placeholder="Seu nome completo"
                    className="w-full px-4 py-3 rounded-xl border outline-none transition-all bg-[#0B0F19] border-[#1E293B] text-white focus:border-[#00E5FF]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-[#94A3B8]">
                    Cargo Alvo
                  </label>
                  <input
                    type="text"
                    value={resumeData.cargo}
                    onChange={(e) => handleInputChange('cargo', e.target.value)}
                    placeholder="Ex: Desenvolvedor Front-end Senior"
                    className="w-full px-4 py-3 rounded-xl border outline-none transition-all bg-[#0B0F19] border-[#1E293B] text-white focus:border-[#00E5FF]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-[#94A3B8]">
                      E-mail
                    </label>
                    <input
                      type="email"
                      value={resumeData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full px-4 py-3 rounded-xl border outline-none transition-all bg-[#0B0F19] border-[#1E293B] text-white focus:border-[#00E5FF]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-[#94A3B8]">
                      Telefone
                    </label>
                    <input
                      type="tel"
                      value={resumeData.telefone}
                      onChange={(e) => handleInputChange('telefone', e.target.value)}
                      placeholder="(00) 00000-0000"
                      className="w-full px-4 py-3 rounded-xl border outline-none transition-all bg-[#0B0F19] border-[#1E293B] text-white focus:border-[#00E5FF]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-[#94A3B8]">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={resumeData.cidade}
                    onChange={(e) => handleInputChange('cidade', e.target.value)}
                    placeholder="Cidade, Estado"
                    className="w-full px-4 py-3 rounded-xl border outline-none transition-all bg-[#0B0F19] border-[#1E293B] text-white focus:border-[#00E5FF]"
                  />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-bold mb-6 text-white">
                  Experiência Profissional
                </h2>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-[#94A3B8]">
                    Resumo Profissional
                  </label>
                  <textarea
                    value={resumeData.experiencia}
                    onChange={(e) => handleInputChange('experiencia', e.target.value)}
                    placeholder="Descreva sua experiência profissional, principais conquistas e objetivos de carreira..."
                    rows={12}
                    className="w-full px-4 py-3 rounded-xl border outline-none transition-all resize-none bg-[#0B0F19] border-[#1E293B] text-white focus:border-[#00E5FF]"
                  />
                </div>

                <div className="p-6 rounded-xl border border-[#1E293B]">
                  <p className="mb-4 text-[#94A3B8]">
                    Seu currículo está pronto para exportação. Revise o preview ao lado e clique no botão abaixo para gerar o PDF.
                  </p>
                  <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-8 py-4 rounded-xl font-semibold transition-all hover:scale-105 bg-[#00E676] text-[#0B0F19]"
                    style={{ boxShadow: '0 0 20px rgba(0, 230, 118, 0.3)' }}
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
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 bg-[#111827] text-white border border-[#1E293B]"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
            <button
              onClick={handleNext}
              disabled={currentStep === 2}
              className="flex items-center gap-2 px-8 py-3 rounded-xl font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105"
              style={{
                backgroundColor: currentStep === 2 ? '#111827' : '#00E5FF',
                color: currentStep === 2 ? '#94A3B8' : '#0B0F19',
                boxShadow: currentStep === 2 ? 'none' : '0 0 20px rgba(0, 229, 255, 0.3)'
              }}
            >
              {currentStep === 2 ? 'Concluído' : 'Avançar'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="w-full lg:w-1/2 p-8 flex items-center justify-center overflow-y-auto bg-[#0B0F19] print:hidden">
          <div className="w-full max-w-4xl">
            <ResumePreview resumeData={resumeData} />
          </div>
        </div>
      </div>

      {/* Print-only container */}
      <div className="hidden print:block print:w-full print:p-0 print:m-0">
        <ResumePreview resumeData={resumeData} />
      </div>
    </div>
  );
};

export default App;
