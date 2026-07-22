'use client'

import { useState } from 'react';
import { FileText, Sparkles, Lightbulb } from 'lucide-react';
import { useResume } from '@/context/ResumeContext';
import AIEnhanceButton from './AIEnhanceButton';

const SummaryForm = () => {
  const { resume, updateSummary } = useResume();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWithTimeout = (url: string, options: RequestInit = {}, timeoutMs = 15000): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timeoutId));
  };

  const handleGenerateSummary = async () => {
    if (resume.experience.length === 0 || resume.skills.length === 0) {
      return;
    }

    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetchWithTimeout('/api/ai/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experience: resume.experience,
          skills: resume.skills,
          profession: resume.experience[0]?.position,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Falha ao gerar resumo.');
      }

      const data = await res.json();
      if (data.summary) {
        updateSummary(data.summary);
      }
    } catch (error: any) {
      const message = error?.name === 'AbortError' ? 'Tempo esgotado. Tente novamente.' : (error instanceof Error ? error.message : 'Erro ao gerar resumo.');
      setError(message);
      console.error('Failed to generate summary:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const templates = [
    "Profissional com [X] anos de experiência em [área], especializado em [competências principais]. Busco aplicar minhas habilidades em [tipo de empresa] para contribuir com [objetivo específico].",
    "Especialista em [área] com sólida experiência em [competências chave]. Com histórico de conquistas em [tipo de projeto], busco oportunidades para [objetivo profissional].",
    "Profissional motivado com experiência em [área], focado em [competências]. Busco posição desafiadora onde possa aplicar minhas habilidades em [especialidade] e contribuir para o crescimento da empresa.",
  ];

  const applyTemplate = (template: string) => {
    updateSummary(template);
  };

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Objetivo Profissional</h2>
      
      {error && (
        <div id="summary-error" role="alert" className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label htmlFor="summary-textarea" className="block text-sm font-semibold text-gray-900">Objetivo Profissional</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleGenerateSummary}
              disabled={isGenerating || resume.experience.length === 0 || resume.skills.length === 0}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all bg-emerald-600 text-white hover:bg-emerald-700 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              title="Gerar objetivo com IA"
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-xs">Gerar com IA</span>
            </button>
            <AIEnhanceButton
              text={resume.summary}
              context="Objetivo profissional para currículo"
              profession={resume.experience[0]?.position}
              onEnhanced={(enhanced: string) => updateSummary(enhanced)}
            />
          </div>
        </div>
        <textarea
          id="summary-textarea"
          value={resume.summary}
          onChange={(e) => updateSummary(e.target.value)}
          placeholder="Descreva seus objetivos profissionais e o que você busca em sua próxima posição..."
          rows={6}
          aria-describedby={error ? 'summary-error' : undefined}
          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none transition-all duration-200 text-gray-900 placeholder-gray-500 resize-none"
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-900">
            <p className="font-semibold mb-2">Templates Rápidos:</p>
            <div className="space-y-2">
              {templates.map((template, index) => (
                <button
                  key={index}
                  onClick={() => applyTemplate(template)}
                  className="block w-full text-left px-3 py-2 bg-white border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-xs text-gray-700"
                >
                  {template.substring(0, 80)}...
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-900">
            <p className="font-semibold mb-1">Dicas para um bom objetivo:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Seja específico sobre o tipo de posição desejada</li>
              <li>Destaque suas principais qualificações</li>
              <li>Mencione o valor que você pode agregar à empresa</li>
              <li>Mantenha conciso (2-3 frases)</li>
              <li>Personalize para cada vaga alvo</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryForm;
