'use client'

import { useState, useCallback } from 'react';
import { Globe, Plus, Trash2, Languages } from 'lucide-react';
import { Language } from '@/types/resume';
import { useResume } from '@/context/ResumeContext';

const LanguagesForm = () => {
  const { resume, addLanguage, removeLanguage } = useResume();
  const languages = resume.languages ?? [];

  const [newLanguage, setNewLanguage] = useState<Partial<Language>>({
    name: '',
    proficiency: 'Intermediate',
  });

  const generateId = useCallback(() => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const handleAdd = () => {
    if (newLanguage.name) {
      addLanguage({
        id: generateId(),
        name: newLanguage.name,
        proficiency: newLanguage.proficiency || 'Intermediate',
      });
      setNewLanguage({ name: '', proficiency: 'Intermediate' });
    }
  };

  const getProficiencyLabel = (proficiency: string) => {
    switch (proficiency) {
      case 'Basic': return 'Básico';
      case 'Intermediate': return 'Intermediário';
      case 'Advanced': return 'Avançado';
      case 'Fluent': return 'Fluente';
      case 'Native': return 'Nativo';
      default: return proficiency;
    }
  };

  const getProficiencyColor = (proficiency: string) => {
    switch (proficiency) {
      case 'Basic': return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'Intermediate': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'Advanced': return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'Fluent': return 'bg-emerald-100 text-emerald-700 border-emerald-300';
      case 'Native': return 'bg-emerald-600 text-white border-emerald-700';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getProficiencyPercentage = (proficiency: string) => {
    switch (proficiency) {
      case 'Basic': return 25;
      case 'Intermediate': return 50;
      case 'Advanced': return 75;
      case 'Fluent': return 90;
      case 'Native': return 100;
      default: return 0;
    }
  };

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Idiomas</h2>
      
      <div className="flex flex-wrap gap-3">
        {languages.map((language) => (
          <div
            key={language.id}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-gray-200 shadow-sm min-w-[200px]"
          >
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-900 font-medium">{language.name}</span>
                <button
                  onClick={() => removeLanguage(language.id)}
                  className="text-gray-400 hover:text-red-600 transition p-1 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                    style={{ width: `${getProficiencyPercentage(language.proficiency)}%` }}
                  />
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${getProficiencyColor(language.proficiency)}`}>
                  {getProficiencyLabel(language.proficiency)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-6 rounded-lg border border-emerald-200">
        <h3 className="font-semibold text-emerald-600 mb-4 flex items-center gap-2">
          <Languages className="w-5 h-5" />
          Adicionar Idioma
        </h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">Nome do Idioma</label>
            <div className="relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Ex: Inglês, Espanhol, Francês"
                value={newLanguage.name}
                onChange={(e) => setNewLanguage({ ...newLanguage, name: e.target.value })}
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none transition-all duration-200 text-gray-900 placeholder-gray-500"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">Nível de Proficiência</label>
            <select
              value={newLanguage.proficiency}
              onChange={(e) => setNewLanguage({ ...newLanguage, proficiency: e.target.value as Language['proficiency'] })}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all duration-200 text-gray-900"
            >
              <option value="Basic">Básico</option>
              <option value="Intermediate">Intermediário</option>
              <option value="Advanced">Avançado</option>
              <option value="Fluent">Fluente</option>
              <option value="Native">Nativo</option>
            </select>
          </div>
          
          <button
            onClick={handleAdd}
            className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg hover:bg-emerald-700 transition-all duration-200 font-medium shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Adicionar Idioma
          </button>
        </div>
      </div>
    </div>
  );
};

export default LanguagesForm;
