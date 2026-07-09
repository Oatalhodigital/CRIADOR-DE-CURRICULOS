import React, { useState, useCallback } from 'react';
import { Briefcase, Plus, Trash2, Building2 } from 'lucide-react';
import { Experience } from '../types/resume';
import { useResume } from '../context/ResumeContext';

const ExperienceForm: React.FC = () => {
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
      {experience.map((exp) => (
        <div key={exp.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{exp.position}</h3>
              <p className="text-sm text-gray-600">{exp.company}</p>
            </div>
            <button
              onClick={() => removeExperience(exp.id)}
              className="text-gray-400 hover:text-red-500 transition p-1 hover:bg-red-50 rounded-lg"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-gray-500">
            {exp.startDate} - {exp.current ? 'Atual' : exp.endDate}
          </p>
          <p className="text-sm text-gray-700 mt-2">{exp.description}</p>
        </div>
      ))}

      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100">
        <h3 className="font-semibold text-indigo-900 mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Adicionar Experiência
        </h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Empresa</label>
            <input
              type="text"
              placeholder="Nome da empresa"
              value={newExperience.company}
              onChange={(e) => setNewExperience({ ...newExperience, company: e.target.value })}
              className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all duration-300 text-gray-900 placeholder-gray-400"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Cargo</label>
            <input
              type="text"
              placeholder="Seu cargo na empresa"
              value={newExperience.position}
              onChange={(e) => setNewExperience({ ...newExperience, position: e.target.value })}
              className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all duration-300 text-gray-900 placeholder-gray-400"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Data Início</label>
              <input
                type="month"
                value={newExperience.startDate}
                onChange={(e) => setNewExperience({ ...newExperience, startDate: e.target.value })}
                className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all duration-300 text-gray-900"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Data Fim</label>
              <input
                type="month"
                value={newExperience.endDate}
                onChange={(e) => setNewExperience({ ...newExperience, endDate: e.target.value })}
                disabled={newExperience.current}
                className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all duration-300 text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>
          
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={newExperience.current}
              onChange={(e) => setNewExperience({ ...newExperience, current: e.target.checked })}
              className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 focus:ring-offset-0"
            />
            <span className="text-sm font-medium text-gray-700">Emprego atual</span>
          </label>
          
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Descrição</label>
            <textarea
              placeholder="Descreva suas responsabilidades e conquistas..."
              value={newExperience.description}
              onChange={(e) => setNewExperience({ ...newExperience, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all duration-300 resize-none text-gray-900 placeholder-gray-400"
            />
          </div>
          
          <button
            onClick={handleAdd}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3.5 px-4 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-medium shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
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
