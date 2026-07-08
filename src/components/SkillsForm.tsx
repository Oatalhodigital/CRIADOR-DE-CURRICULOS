import React, { useState } from 'react';
import { Star, Plus, Trash2 } from 'lucide-react';
import { Skill } from '../types/resume';
import { useResume } from '../context/ResumeContext';

const SkillsForm: React.FC = () => {
  const { resume, addSkill, removeSkill } = useResume();
  const { skills } = resume;

  const [newSkill, setNewSkill] = useState<Partial<Skill>>({
    name: '',
    level: 'Intermediate',
  });

  const handleAdd = () => {
    if (newSkill.name) {
      addSkill({
        id: Date.now().toString(),
        name: newSkill.name,
        level: newSkill.level || 'Intermediate',
      });
      setNewSkill({ name: '', level: 'Intermediate' });
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-blue-100 text-blue-800';
      case 'Advanced': return 'bg-purple-100 text-purple-800';
      case 'Expert': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <Star className="w-6 h-6" />
        Habilidades
      </h2>

      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <div
            key={skill.id}
            className="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800"
          >
            <span>{skill.name}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${getLevelColor(skill.level)}`}>
              {skill.level}
            </span>
            <button
              onClick={() => removeSkill(skill.id)}
              className="text-red-500 hover:text-red-700 transition ml-1"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
        <h3 className="font-semibold text-purple-800 mb-3">Adicionar Habilidade</h3>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Nome da habilidade *"
            value={newSkill.name}
            onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
          />
          <select
            value={newSkill.level}
            onChange={(e) => setNewSkill({ ...newSkill, level: e.target.value as Skill['level'] })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
          >
            <option value="Beginner">Iniciante</option>
            <option value="Intermediate">Intermediário</option>
            <option value="Advanced">Avançado</option>
            <option value="Expert">Expert</option>
          </select>
          <button
            onClick={handleAdd}
            className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Adicionar Habilidade
          </button>
        </div>
      </div>
    </div>
  );
};

export default SkillsForm;
