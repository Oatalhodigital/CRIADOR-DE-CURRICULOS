import React, { useState } from 'react';
import ResumePreview from './components/ResumePreview';
import { ArrowRight, ArrowLeft, Download, User, Briefcase, FileText, Settings } from 'lucide-react';

const App = () => {
  const [activeTab, setActiveTab] = useState('personal');
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

  const handleExport = () => {
    window.print();
  };

  const tabs = [
    { id: 'personal', label: 'Dados Pessoais', icon: User },
    { id: 'experience', label: 'Experiência', icon: Briefcase },
    { id: 'preview', label: 'Preview', icon: FileText },
    { id: 'settings', label: 'Configurações', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-[#0B0F19]">
      {/* Header */}
      <header className="px-8 py-4 border-b border-[#1E293B] print:hidden">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs font-semibold tracking-wider mb-1 text-[#00E5FF]">
              LEANDRO SENA | LS - Soluções Digitais
            </p>
            <h1 className="text-xl font-bold text-white">
              Criador de Currículos
            </h1>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105 bg-[#00E676] text-[#0B0F19]"
            style={{ boxShadow: '0 0 20px rgba(0, 230, 118, 0.3)' }}
          >
            <Download className="w-4 h-4" />
            Exportar PDF
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-80px)]">
        {/* Sidebar Navigation */}
        <div className="w-full lg:w-64 bg-[#111827] border-r border-[#1E293B] p-4 print:hidden">
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === tab.id
                      ? 'bg-[#00E5FF] text-[#0B0F19] font-semibold'
                      : 'text-[#94A3B8] hover:bg-[#1E293B] hover:text-white'
                  }`}
                  style={{
                    boxShadow: activeTab === tab.id ? '0 0 20px rgba(0, 229, 255, 0.3)' : 'none'
                  }}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Panel - Form Content */}
        <div className="flex-1 p-8 overflow-y-auto print:hidden">
          <div className="max-w-3xl mx-auto">
            {activeTab === 'personal' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-bold mb-6 text-white">
                  Informações Pessoais
                </h2>
                
                <div className="rounded-2xl p-6 border border-[#1E293B] bg-[#111827] space-y-6">
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

                <button
                  onClick={() => setActiveTab('experience')}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all hover:scale-105 bg-[#00E5FF] text-[#0B0F19]"
                  style={{ boxShadow: '0 0 20px rgba(0, 229, 255, 0.3)' }}
                >
                  Continuar
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {activeTab === 'experience' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-bold mb-6 text-white">
                  Experiência Profissional
                </h2>
                
                <div className="rounded-2xl p-6 border border-[#1E293B] bg-[#111827] space-y-6">
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
                </div>

                <div className="flex justify-between items-center">
                  <button
                    onClick={() => setActiveTab('personal')}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all hover:scale-105 bg-[#111827] text-white border border-[#1E293B]"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar
                  </button>
                  <button
                    onClick={() => setActiveTab('preview')}
                    className="flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all hover:scale-105 bg-[#00E5FF] text-[#0B0F19]"
                    style={{ boxShadow: '0 0 20px rgba(0, 229, 255, 0.3)' }}
                  >
                    Ver Preview
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'preview' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-bold mb-6 text-white">
                  Preview do Currículo
                </h2>
                
                <div className="rounded-2xl p-6 border border-[#1E293B] bg-[#111827]">
                  <p className="mb-4 text-[#94A3B8]">
                    Revise seu currículo no painel ao lado. Quando estiver satisfeito, clique em "Exportar PDF" no header para baixar.
                  </p>
                  <button
                    onClick={() => setActiveTab('experience')}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all hover:scale-105 bg-[#111827] text-white border border-[#1E293B]"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Editar
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-bold mb-6 text-white">
                  Configurações
                </h2>
                
                <div className="rounded-2xl p-6 border border-[#1E293B] bg-[#111827] space-y-6">
                  <p className="text-[#94A3B8]">
                    Configurações adicionais estarão disponíveis em breve.
                  </p>
                </div>
              </div>
            )}
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
