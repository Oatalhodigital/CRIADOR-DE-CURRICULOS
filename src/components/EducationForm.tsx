'use client'

import { useState, useCallback } from 'react';
import { GraduationCap, Plus, Trash2, School } from 'lucide-react';
import { Education } from '@/types/resume';
import { useResume } from '@/context/ResumeContext';

const EducationForm = () => {
  const { resume, addEducation, updateEducation, removeEducation } = useResume();
  const { education } = resume;

  const [newEducation, setNewEducation] = useState<Partial<Education>>({
    institution: '',
    degree: '',
    field: '',
    startDate: '',
    endDate: '',
    current: false,
  });

  const generateId = useCallback(() => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const handleAdd = () => {
    if (newEducation.institution && newEducation.degree) {
      addEducation({
        id: generateId(),
        institution: newEducation.institution,
        degree: newEducation.degree,
        field: newEducation.field || '',
        startDate: newEducation.startDate || '',
        endDate: newEducation.endDate || '',
        current: newEducation.current || false,
      });
      setNewEducation({
        institution: '',
        degree: '',
        field: '',
        startDate: '',
        endDate: '',
        current: false,
      });
    }
  };

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-white mb-6">Educação</h2>
      
      {education.map((edu) => (
        <div key={edu.id} className="bg-card p-5 rounded-lg border border-border shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">{edu.degree}</h3>
              <p className="text-sm text-muted-foreground">{edu.institution}</p>
              <p className="text-sm text-muted-foreground">{edu.field}</p>
            </div>
            <button
              onClick={() => removeEducation(edu.id)}
              className="text-muted-foreground hover:text-destructive transition p-1 hover:bg-destructive/10 rounded-lg"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground">
            {edu.startDate} - {edu.current ? 'Atual' : edu.endDate}
          </p>
        </div>
      ))}

      <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6 rounded-lg border border-primary/20">
        <h3 className="font-semibold text-primary mb-4 flex items-center gap-2">
          <School className="w-5 h-5" />
          Adicionar Formação
        </h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground">Instituição</label>
            <input
              type="text"
              placeholder="Nome da instituição"
              value={newEducation.institution}
              onChange={(e) => setNewEducation({ ...newEducation, institution: e.target.value })}
              className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200 text-foreground placeholder-muted-foreground"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground">Grau/Diploma</label>
            <input
              type="text"
              placeholder="Ex: Bacharelado, Mestrado, Doutorado"
              value={newEducation.degree}
              onChange={(e) => setNewEducation({ ...newEducation, degree: e.target.value })}
              className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-foreground placeholder-muted-foreground"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground">Área de Estudo</label>
            <input
              type="text"
              placeholder="Ex: Ciência da Computação"
              value={newEducation.field}
              onChange={(e) => setNewEducation({ ...newEducation, field: e.target.value })}
              className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-foreground placeholder-muted-foreground"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-foreground">Data Início</label>
              <input
                type="month"
                value={newEducation.startDate}
                onChange={(e) => setNewEducation({ ...newEducation, startDate: e.target.value })}
                className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-foreground"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-foreground">Data Fim</label>
              <input
                type="month"
                value={newEducation.endDate}
                onChange={(e) => setNewEducation({ ...newEducation, endDate: e.target.value })}
                disabled={newEducation.current}
                className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-foreground disabled:bg-muted disabled:cursor-not-allowed"
              />
            </div>
          </div>
          
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={newEducation.current}
              onChange={(e) => setNewEducation({ ...newEducation, current: e.target.checked })}
              className="w-5 h-5 text-primary rounded focus:ring-primary focus:ring-offset-0"
            />
            <span className="text-sm font-medium text-foreground">Cursando atualmente</span>
          </label>
          
          <button
            onClick={handleAdd}
            className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-lg hover:bg-primary/90 transition-all duration-200 font-medium shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Adicionar Formação
          </button>
        </div>
      </div>
    </div>
  );
};

export default EducationForm;
