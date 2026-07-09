import React, { useState, useCallback } from 'react';
import { Star, Plus, Trash2, Zap } from 'lucide-react';
import { Skill } from '../types/resume';
import { useResume } from '../context/ResumeContext';

const SkillsForm: React.FC<{ onFocusTip?: (tip: string) => void }> = ({ onFocusTip }) => {
  const { resume, addSkill, removeSkill } = useResume();
  const { skills } = resume;

  const [newSkill, setNewSkill] = useState<Partial<Skill>>({
    name: '',
    level: 'Intermediate',
  });

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
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner': return 'bg-green-100 text-green-700 border-green-200';
      case 'Intermediate': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Advanced': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Expert': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-5">
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
              className="text-gray-400 hover:text-red-500 transition p-1 hover:bg-red-50 rounded-lg"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100">
        <h3 className="font-semibold text-indigo-900 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Adicionar Habilidade
        </h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Nome da Habilidade</label>
            <input
              type="text"
              placeholder="Ex: React, Python, Design Gráfico"
              value={newSkill.name}
              onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
              onFocus={() => onFocusTip?.('Coloque de 5 a 7 competências que tenham relação direta com a vaga que você deseja.')}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all duration-200 text-gray-700 shadow-sm placeholder-gray-400"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Nível</label>
            <select
              value={newSkill.level}
              onChange={(e) => setNewSkill({ ...newSkill, level: e.target.value as Skill['level'] })}
              className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all duration-300 text-gray-900"
            >
              <option value="Beginner">Iniciante</option>
              <option value="Intermediate">Intermediário</option>
              <option value="Advanced">Avançado</option>
              <option value="Expert">Expert</option>
            </select>
          </div>
          
          <button
            onClick={handleAdd}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3.5 px-4 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-medium shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
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
