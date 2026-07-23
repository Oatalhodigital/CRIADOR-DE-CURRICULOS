'use client'

import { useState, useCallback, useEffect } from 'react';
import { Star, Plus, Trash2, Zap } from 'lucide-react';
import { Skill } from '@/types/resume';
import { useResume } from '@/context/ResumeContext';
import SearchableSelect from '@/components/ui/SearchableSelect';
import { skillOptions } from '@/data/skills';

const SkillsForm = () => {
  const { resume, addSkill, removeSkill, setDraftSkill } = useResume();
  const { skills } = resume;

  const [newSkill, setNewSkill] = useState<Partial<Skill>>({
    name: '',
    level: 'Intermediate',
  });

  // Update draft state in context for real-time preview
  useEffect(() => {
    if (newSkill.name) {
      setDraftSkill(newSkill);
    } else {
      setDraftSkill(null);
    }
  }, [newSkill, setDraftSkill]);

  const generateId = useCallback(() => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const handleAdd = () => {
    if (newSkill.name) {
      addSkill({
        id: generateId(),
        name: newSkill.name,
        level: newSkill.level || 'Intermediate',
      });
      setNewSkill({ name: '', level: 'Intermediate' });
      setDraftSkill(null);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner': return 'bg-green-100 text-green-700 border-green-300';
      case 'Intermediate': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'Advanced': return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'Expert': return 'bg-orange-100 text-orange-700 border-orange-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Habilidades</h2>
      
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <div
            key={skill.id}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-white border border-gray-200 shadow-sm"
          >
            <span className="text-gray-900">{skill.name}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getLevelColor(skill.level)}`}>
              {skill.level === 'Beginner' && 'Iniciante'}
              {skill.level === 'Intermediate' && 'Intermediário'}
              {skill.level === 'Advanced' && 'Avançado'}
              {skill.level === 'Expert' && 'Expert'}
            </span>
            <button
              onClick={() => removeSkill(skill.id)}
              className="text-gray-600 hover:text-red-600 transition p-1 hover:bg-red-50 rounded-lg"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-6 rounded-lg border border-emerald-200">
        <h3 className="font-semibold text-emerald-600 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Adicionar Habilidade
        </h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <SearchableSelect
              label="Nome da Habilidade"
              options={skillOptions}
              value={newSkill.name || ''}
              onChange={(value) => setNewSkill({ ...newSkill, name: value })}
              placeholder="Ex: React, Python, Design Gráfico"
              allowFreeText
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">Nível</label>
            <select
              value={newSkill.level}
              onChange={(e) => setNewSkill({ ...newSkill, level: e.target.value as Skill['level'] })}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all duration-200 text-gray-900"
            >
              <option value="Beginner">Iniciante</option>
              <option value="Intermediate">Intermediário</option>
              <option value="Advanced">Avançado</option>
              <option value="Expert">Expert</option>
            </select>
          </div>
          
          <button
            onClick={handleAdd}
            className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg hover:bg-emerald-700 transition-all duration-200 font-medium shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Adicionar Habilidade
          </button>
        </div>
      </div>
    </div>
  );
};

export default SkillsForm;
