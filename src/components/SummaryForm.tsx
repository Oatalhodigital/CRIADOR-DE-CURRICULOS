'use client'

import { useState } from 'react';
import { FileText, Sparkles } from 'lucide-react';
import { useResume } from '@/context/ResumeContext';
import AIEnhanceButton from './AIEnhanceButton';
import { generateSummary } from '@/services/openai';

const SummaryForm = () => {
  const { resume, updateSummary } = useResume();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateSummary = async () => {
    if (resume.experience.length === 0 || resume.skills.length === 0) {
      return;
    }

    setIsGenerating(true);
    try {
      const experiences = resume.experience.map(exp => exp.description);
      const skills = resume.skills.map(skill => skill.name);
      const generatedSummary = await generateSummary(experiences, skills);
      if (generatedSummary) {
        updateSummary(generatedSummary);
      }
    } catch (error) {
      console.error('Failed to generate summary:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-white mb-6">Resumo Profissional</h2>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="block text-sm font-semibold text-foreground">Resumo Profissional</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleGenerateSummary}
              disabled={isGenerating || resume.experience.length === 0 || resume.skills.length === 0}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all bg-primary text-primary-foreground hover:bg-primary/90 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
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
          className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200 text-foreground placeholder-muted-foreground resize-none"
        />
      </div>

      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-sm text-foreground">
            <p className="font-semibold mb-1">Dicas para um bom resumo:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
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
