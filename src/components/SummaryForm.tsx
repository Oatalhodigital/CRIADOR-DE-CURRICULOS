'use client'

import { useState } from 'react';
import { FileText, Sparkles } from 'lucide-react';
import { useResume } from '@/context/ResumeContext';
import AIEnhanceButton from './AIEnhanceButton';

const SummaryForm = () => {
  const { resume, updateSummary } = useResume();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateSummary = async () => {
    if (resume.experience.length === 0 || resume.skills.length === 0) {
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experience: resume.experience,
          skills: resume.skills,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Falha ao gerar resumo.');
      }

      const data = await res.json();
      if (data.summary) {
        updateSummary(data.summary);
      }
    } catch (error) {
      console.error('Failed to generate summary:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Resumo Profissional</h2>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="block text-sm font-semibold text-gray-900">Resumo Profissional</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleGenerateSummary}
              disabled={isGenerating || resume.experience.length === 0 || resume.skills.length === 0}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all bg-emerald-600 text-white hover:bg-emerald-700 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              title="Gerar resumo com IA"
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-xs">Gerar com IA</span>
            </button>
            <AIEnhanceButton
              text={resume.summary}
              context="Resumo profissional para currículo"
              onEnhanced={(enhanced: string) => updateSummary(enhanced)}
            />
          </div>
        </div>
        <textarea
          value={resume.summary}
          onChange={(e) => updateSummary(e.target.value)}
          placeholder="Descreva suas principais qualificações, experiência profissional e objetivos de carreira..."
          rows={6}
          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none transition-all duration-200 text-gray-900 placeholder-gray-500 resize-none"
        />
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-900">
            <p className="font-semibold mb-1">Dicas para um bom resumo:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Seja conciso (máximo 150 palavras)</li>
              <li>Destaque suas principais competências</li>
              <li>Mencione anos de experiência se relevante</li>
              <li>Foque em resultados e conquistas</li>
              <li>Personalize para a vaga desejada</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryForm;
