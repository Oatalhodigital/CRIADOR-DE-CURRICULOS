'use client'

import { useState, useCallback } from 'react';
import { Star, Plus, Trash2, Zap } from 'lucide-react';
import { Skill } from '@/types/resume';
import { useResume } from '@/context/ResumeContext';

const SkillsForm = () => {
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
      case 'Beginner': return 'bg-green-100/20 text-green-400 border-green-400/30';
      case 'Intermediate': return 'bg-blue-100/20 text-blue-400 border-blue-400/30';
      case 'Advanced': return 'bg-purple-100/20 text-purple-400 border-purple-400/30';
      case 'Expert': return 'bg-orange-100/20 text-orange-400 border-orange-400/30';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-white mb-6">Habilidades</h2>
      
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <div
            key={skill.id}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-card border border-border shadow-sm"
          >
            <span className="text-foreground">{skill.name}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getLevelColor(skill.level)}`}>
              {skill.level === 'Beginner' && 'Iniciante'}
              {skill.level === 'Intermediate' && 'Intermediário'}
              {skill.level === 'Advanced' && 'Avançado'}
              {skill.level === 'Expert' && 'Expert'}
            </span>
            <button
              onClick={() => removeSkill(skill.id)}
              className="text-muted-foreground hover:text-destructive transition p-1 hover:bg-destructive/10 rounded-lg"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6 rounded-lg border border-primary/20">
        <h3 className="font-semibold text-primary mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Adicionar Habilidade
        </h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground">Nome da Habilidade</label>
            <input
              type="text"
              placeholder="Ex: React, Python, Design Gráfico"
              value={newSkill.name}
              onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
              className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200 text-foreground placeholder-muted-foreground"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground">Nível</label>
            <select
              value={newSkill.level}
              onChange={(e) => setNewSkill({ ...newSkill, level: e.target.value as Skill['level'] })}
              className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-foreground"
            >
              <option value="Beginner">Iniciante</option>
              <option value="Intermediate">Intermediário</option>
              <option value="Advanced">Avançado</option>
              <option value="Expert">Expert</option>
            </select>
          </div>
          
          <button
            onClick={handleAdd}
            className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-lg hover:bg-primary/90 transition-all duration-200 font-medium shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
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
