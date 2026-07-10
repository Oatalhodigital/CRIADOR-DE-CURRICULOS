'use client'

import { ArrowRight, Sparkles, FileText, Zap, X, Check, AlertTriangle, ChevronRight, CreditCard } from 'lucide-react';
import { useState } from 'react';

interface LandingPageProps {
  onStart: () => void;
}

const LandingPage = ({ onStart }: LandingPageProps) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const scrollToEditor = () => {
    onStart();
  };

  const faqs = [
    {
      question: "O que é um currículo otimizado para ATS?",
      answer: "ATS (Applicant Tracking System) são os robôs de RH usados pelas grandes empresas para filtrar currículos. Currículos com gráficos, barras de progresso e layouts complexos (estilo Canva) são rejeitados automaticamente. Nossa solução gera um layout limpo, puramente textual e 100% legível por esses sistemas."
    },
    {
      question: "Tem alguma assinatura mensal?",
      answer: "Não! Nosso modelo é pagamento único por download. Você paga apenas R$ 10,00 quando estiver satisfeito com seu currículo e quiser baixar em PDF. Sem assinaturas, sem cobranças escondidas."
    },
    {
      question: "Posso editar depois?",
      answer: "Sim! Seus dados ficam salvos localmente no navegador. Você pode voltar e editar seu currículo quantas vezes quiser antes de pagar pelo download."
    },
    {
      question: "Como funciona a IA?",
      answer: "Nossa IA ajuda a otimizar seus textos de experiência profissional, tornando-os mais impactantes e focados em resultados. Basta clicar no botão 'IA' ao lado de cada campo para receber sugestões melhoradas."
    }
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans overflow-x-hidden">
      {/* Header */}
      <header className="flex justify-between items-center px-6 md:px-12 py-6 border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="text-xl md:text-2xl font-bold tracking-tight">
          LEANDRO SENA<span className="text-emerald-600 font-normal text-sm md:text-base ml-2">LS - Soluções Digitais</span>
        </div>
        <button
          onClick={scrollToEditor}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-lg transition-all duration-200 text-sm md:text-base"
        >
          Criar Currículo
        </button>
      </header>

      {/* Hero Section */}
      <section className="px-6 md:px-12 py-16 md:py-24 max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto">
          <span className="inline-block bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold mb-6 border border-emerald-200">
            ✨ Otimizado para sistemas ATS
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 tracking-tight text-gray-900">
            Seu currículo aprovado pelos robôs de RH (ATS) em menos de 10 minutos.
          </h1>
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-8 max-w-3xl mx-auto">
            Design minimalista padrão de mercado, otimizado para sistemas de recrutamento e com auxílio de IA para destacar suas conquistas. Sem cadastros chatos, direto ao ponto.
          </p>
          
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={scrollToEditor}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all duration-200 shadow-lg hover:shadow-xl w-full md:w-auto"
            >
              Criar Meu Currículo Agora
              <ArrowRight className="w-5 h-5 inline ml-2" />
            </button>
            <span className="text-sm text-gray-500 flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-600" />
              Comece de graça. Pague apenas R$ 10,00 para baixar.
            </span>
          </div>
        </div>
      </section>

      {/* Problem vs Solution Section */}
      <section className="px-6 md:px-12 py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">O Problema vs. A Solução</h2>
            <p className="text-gray-600 text-lg">Por que currículos "bonitos" não funcionam</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Problem Card */}
            <div className="bg-white border border-red-200 rounded-2xl p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                  <X className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-2xl font-bold text-red-600">O Que NÃO Funciona</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Gráficos, barras de progresso e elementos visuais complexos</span>
                </li>
                <li className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Layouts de duas colunas (estilo Canva/infográfico)</span>
                </li>
                <li className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Fontes não padronizadas e cores excessivas</span>
                </li>
                <li className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Resultados: <strong className="text-red-600">Rejeição automática pelos robôs de RH</strong></span>
                </li>
              </ul>
            </div>

            {/* Solution Card */}
            <div className="bg-white border border-emerald-200 rounded-2xl p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <Check className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-bold text-emerald-600">Nossa Solução</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Layout limpo, puramente textual e estruturado</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Formato padrão aceito por 99% dos sistemas ATS</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">IA integrada para otimizar suas conquistas</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Resultados: <strong className="text-emerald-600">Chega nas mãos dos recrutadores humanos</strong></span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="px-6 md:px-12 py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Como Funciona</h2>
            <p className="text-gray-600 text-lg">3 passos simples para seu currículo profissional</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 hover:border-emerald-300 transition-all duration-300 hover:-translate-y-1">
              <div className="w-14 h-14 rounded-xl bg-emerald-50 flex items-center justify-center mb-6">
                <FileText className="w-7 h-7 text-emerald-600" />
              </div>
              <div className="text-sm font-bold text-emerald-600 mb-2">PASSO 1</div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Preencha seus dados</h3>
              <p className="text-gray-600 leading-relaxed">
                Interface guiada passo a passo. Adicione suas informações pessoais, experiência, educação e habilidades de forma organizada.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 hover:border-emerald-300 transition-all duration-300 hover:-translate-y-1">
              <div className="w-14 h-14 rounded-xl bg-emerald-50 flex items-center justify-center mb-6">
                <Sparkles className="w-7 h-7 text-emerald-600" />
              </div>
              <div className="text-sm font-bold text-emerald-600 mb-2">PASSO 2</div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Otimize com IA</h3>
              <p className="text-gray-600 leading-relaxed">
                Melhore seus textos de experiência com 1 clique. Nossa IA transforma descrições simples em conquistas impactantes.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 hover:border-emerald-300 transition-all duration-300 hover:-translate-y-1">
              <div className="w-14 h-14 rounded-xl bg-emerald-50 flex items-center justify-center mb-6">
                <CreditCard className="w-7 h-7 text-emerald-600" />
              </div>
              <div className="text-sm font-bold text-emerald-600 mb-2">PASSO 3</div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Libere via PIX</h3>
              <p className="text-gray-600 leading-relaxed">
                Pagamento único de R$ 10,00. Sem assinaturas ou cobranças escondidas. Baixe seu PDF profissional imediatamente.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="px-6 md:px-12 py-16 md:py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Preço Transparente</h2>
            <p className="text-gray-600 text-lg">Sem surpresas, sem assinaturas</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-3xl p-8 md:p-12 shadow-lg">
            <div className="text-center mb-8">
              <div className="text-5xl md:text-6xl font-bold text-emerald-600 mb-2">R$ 10,00</div>
              <div className="text-gray-600 text-lg">Pagamento Único</div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span className="text-gray-700">Acesso vitalício ao editor</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span className="text-gray-700">Layout 100% ATS-friendly</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span className="text-gray-700">Revisão com IA inclusa</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span className="text-gray-700">Download em PDF de alta qualidade</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span className="text-gray-700">Sem assinaturas mensais</span>
              </div>
            </div>

            <button
              onClick={scrollToEditor}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              Começar Agora
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-6 md:px-12 py-16 md:py-24 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Perguntas Frequentes</h2>
            <p className="text-gray-600 text-lg">Tire suas dúvidas antes de começar</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-100 transition-colors"
                >
                  <span className="font-semibold text-lg pr-4 text-gray-900">{faq.question}</span>
                  <ChevronRight
                    className={`w-5 h-5 text-gray-500 transition-transform duration-200 flex-shrink-0 ${
                      openFaq === index ? 'rotate-90' : ''
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-5 pt-0">
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 md:px-12 py-16 md:py-24 bg-emerald-50 border-t border-gray-200">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
            Pronto para criar seu currículo profissional?
          </h2>
          <p className="text-gray-600 text-lg mb-8">
            Comece gratuitamente agora. Pague apenas quando estiver satisfeito.
          </p>
          <button
            onClick={scrollToEditor}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all duration-200 shadow-lg hover:shadow-xl inline-flex items-center gap-2"
          >
            Criar Meu Currículo Agora
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
