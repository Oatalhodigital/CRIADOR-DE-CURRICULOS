'use client'

import { useState, useCallback } from 'react';
import { Briefcase, Plus, Trash2, Building2 } from 'lucide-react';
import { Experience } from '@/types/resume';
import { useResume } from '@/context/ResumeContext';
import AIEnhanceButton from './AIEnhanceButton';

const ExperienceForm = () => {
  const { resume, addExperience, updateExperience, removeExperience } = useResume();
  const { experience } = resume;

  const [newExperience, setNewExperience] = useState<Partial<Experience>>({
    company: '',
    position: '',
    startDate: '',
    endDate: '',
    current: false,
    description: '',
  });

  const generateId = useCallback(() => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const handleAdd = () => {
    if (newExperience.company && newExperience.position) {
      addExperience({
        id: generateId(),
        company: newExperience.company,
        position: newExperience.position,
        startDate: newExperience.startDate || '',
        endDate: newExperience.endDate || '',
        current: newExperience.current || false,
        description: newExperience.description || '',
      });
      setNewExperience({
        company: '',
        position: '',
        startDate: '',
        endDate: '',
        current: false,
        description: '',
      });
    }
  };

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-white mb-6">Experiência Profissional</h2>
      
      {experience.map((exp) => (
        <div key={exp.id} className="bg-card p-5 rounded-lg border border-border shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">{exp.position}</h3>
              <p className="text-sm text-muted-foreground">{exp.company}</p>
            </div>
            <button
              onClick={() => removeExperience(exp.id)}
              className="text-muted-foreground hover:text-destructive transition p-1 hover:bg-destructive/10 rounded-lg"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground">
            {exp.startDate} - {exp.current ? 'Atual' : exp.endDate}
          </p>
          <p className="text-sm text-foreground mt-2">{exp.description}</p>
        </div>
      ))}

      <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6 rounded-lg border border-primary/20">
        <h3 className="font-semibold text-primary mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Adicionar Experiência
        </h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground">Empresa</label>
            <input
              type="text"
              placeholder="Nome da empresa"
              value={newExperience.company}
              onChange={(e) => setNewExperience({ ...newExperience, company: e.target.value })}
              className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200 text-foreground placeholder-muted-foreground"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground">Cargo</label>
            <input
              type="text"
              placeholder="Seu cargo na empresa"
              value={newExperience.position}
              onChange={(e) => setNewExperience({ ...newExperience, position: e.target.value })}
              className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-foreground placeholder-muted-foreground"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-foreground">Data Início</label>
              <input
                type="month"
                value={newExperience.startDate}
                onChange={(e) => setNewExperience({ ...newExperience, startDate: e.target.value })}
                className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-foreground"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-foreground">Data Fim</label>
              <input
                type="month"
                value={newExperience.endDate}
                onChange={(e) => setNewExperience({ ...newExperience, endDate: e.target.value })}
                disabled={newExperience.current}
                className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-foreground disabled:bg-muted disabled:cursor-not-allowed"
              />
            </div>
          </div>
          
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={newExperience.current}
              onChange={(e) => setNewExperience({ ...newExperience, current: e.target.checked })}
              className="w-5 h-5 text-primary rounded focus:ring-primary focus:ring-offset-0"
            />
            <span className="text-sm font-medium text-foreground">Emprego atual</span>
          </label>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-semibold text-foreground">Descrição</label>
              <AIEnhanceButton
                text={newExperience.description || ''}
                context={`Cargo de ${newExperience.position} na empresa ${newExperience.company}`}
                onEnhanced={(enhanced: string) => setNewExperience({ ...newExperience, description: enhanced })}
              />
            </div>
            <textarea
              placeholder="Descreva suas responsabilidades e conquistas..."
              value={newExperience.description}
              onChange={(e) => setNewExperience({ ...newExperience, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 resize-none text-foreground placeholder-muted-foreground"
            />
          </div>
          
          <button
            onClick={handleAdd}
            className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-lg hover:bg-primary/90 transition-all duration-200 font-medium shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Adicionar Experiência
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExperienceForm;
