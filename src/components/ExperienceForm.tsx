'use client'

import { useState, useCallback, useEffect } from 'react';
import { Briefcase, Plus, Trash2, Building2 } from 'lucide-react';
import { Experience } from '@/types/resume';
import { useResume } from '@/context/ResumeContext';
import AIEnhanceButton from './AIEnhanceButton';
import SearchableSelect from '@/components/ui/SearchableSelect';
import { professionOptions } from '@/data/professions';
import { generateExperienceDescription } from '@/lib/aiTemplates';

const ExperienceForm = () => {
  const { resume, addExperience, updateExperience, removeExperience, setDraftExperience } = useResume();
  const { experience } = resume;

  const [newExperience, setNewExperience] = useState<Partial<Experience>>({
    company: '',
    position: '',
    startDate: '',
    endDate: '',
    current: false,
    description: '',
  });

  // Update draft state in context for real-time preview
  useEffect(() => {
    if (newExperience.company || newExperience.position) {
      setDraftExperience(newExperience);
    } else {
      setDraftExperience(null);
    }
  }, [newExperience, setDraftExperience]);

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
      setDraftExperience(null);
    }
  };

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Experiência Profissional</h2>
      
      {experience.map((exp) => (
        <div key={exp.id} className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{exp.position}</h3>
              <p className="text-sm text-gray-600">{exp.company}</p>
            </div>
            <button
              onClick={() => removeExperience(exp.id)}
              className="text-gray-600 hover:text-red-600 transition p-1 hover:bg-red-50 rounded-lg"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-gray-600">
            {exp.startDate} - {exp.current ? 'Atual' : exp.endDate}
          </p>
          <p className="text-sm text-gray-900 mt-2">{exp.description}</p>
        </div>
      ))}

      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-6 rounded-lg border border-emerald-200">
        <h3 className="font-semibold text-emerald-600 mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Adicionar Experiência
        </h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">Empresa</label>
            <input
              type="text"
              placeholder="Nome da empresa"
              value={newExperience.company}
              onChange={(e) => setNewExperience({ ...newExperience, company: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none transition-all duration-200 text-gray-900 placeholder-gray-500"
            />
          </div>
          
          <div className="space-y-2">
            <SearchableSelect
              label="Cargo"
              options={professionOptions}
              value={newExperience.position || ''}
              onChange={(value) => setNewExperience({ ...newExperience, position: value })}
              placeholder="Seu cargo na empresa"
              allowFreeText
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-900">Data Início</label>
              <input
                type="month"
                value={newExperience.startDate}
                onChange={(e) => setNewExperience({ ...newExperience, startDate: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all duration-200 text-gray-900"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-900">Data Fim</label>
              <input
                type="month"
                value={newExperience.endDate}
                onChange={(e) => setNewExperience({ ...newExperience, endDate: e.target.value })}
                disabled={newExperience.current}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all duration-200 text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>
          
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={newExperience.current}
              onChange={(e) => setNewExperience({ ...newExperience, current: e.target.checked })}
              className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-600 focus:ring-offset-0"
            />
            <span className="text-sm font-medium text-gray-900">Emprego atual</span>
          </label>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-semibold text-gray-900">Descrição</label>
              <AIEnhanceButton
                text={newExperience.description || ''}
                context={`Cargo de ${newExperience.position} na empresa ${newExperience.company}`}
                profession={newExperience.position}
                onEnhanced={(enhanced: string) => setNewExperience({ ...newExperience, description: enhanced })}
                fallback={() =>
                  generateExperienceDescription(
                    newExperience.position || '',
                    newExperience.company || '',
                    newExperience.startDate,
                    newExperience.endDate,
                    newExperience.current,
                    newExperience.description
                  )
                }
              />
            </div>
            <textarea
              placeholder="Descreva suas responsabilidades e conquistas..."
              value={newExperience.description}
              onChange={(e) => setNewExperience({ ...newExperience, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all duration-200 resize-none text-gray-900 placeholder-gray-500"
            />
          </div>
          
          <button
            onClick={handleAdd}
            className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg hover:bg-emerald-700 transition-all duration-200 font-medium shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
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
