import React, { useState, useCallback } from 'react';
import { GraduationCap, Plus, Trash2, School } from 'lucide-react';
import { Education } from '../types/resume';
import { useResume } from '../context/ResumeContext';

const EducationForm: React.FC = () => {
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
      {education.map((edu) => (
        <div key={edu.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{edu.degree}</h3>
              <p className="text-sm text-gray-600">{edu.institution}</p>
              <p className="text-sm text-gray-500">{edu.field}</p>
            </div>
            <button
              onClick={() => removeEducation(edu.id)}
              className="text-gray-400 hover:text-red-500 transition p-1 hover:bg-red-50 rounded-lg"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-gray-500">
            {edu.startDate} - {edu.current ? 'Atual' : edu.endDate}
          </p>
        </div>
      ))}

      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100">
        <h3 className="font-semibold text-indigo-900 mb-4 flex items-center gap-2">
          <School className="w-5 h-5" />
          Adicionar Formação
        </h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Instituição</label>
            <input
              type="text"
              placeholder="Nome da instituição"
              value={newEducation.institution}
              onChange={(e) => setNewEducation({ ...newEducation, institution: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all duration-200 text-gray-700 shadow-sm placeholder-gray-400"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Grau/Diploma</label>
            <input
              type="text"
              placeholder="Ex: Bacharelado, Mestrado, Doutorado"
              value={newEducation.degree}
              onChange={(e) => setNewEducation({ ...newEducation, degree: e.target.value })}
              className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all duration-300 text-gray-900 placeholder-gray-400"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Área de Estudo</label>
            <input
              type="text"
              placeholder="Ex: Ciência da Computação"
              value={newEducation.field}
              onChange={(e) => setNewEducation({ ...newEducation, field: e.target.value })}
              className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all duration-300 text-gray-900 placeholder-gray-400"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Data Início</label>
              <input
                type="month"
                value={newEducation.startDate}
                onChange={(e) => setNewEducation({ ...newEducation, startDate: e.target.value })}
                className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all duration-300 text-gray-900"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Data Fim</label>
              <input
                type="month"
                value={newEducation.endDate}
                onChange={(e) => setNewEducation({ ...newEducation, endDate: e.target.value })}
                disabled={newEducation.current}
                className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all duration-300 text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>
          
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={newEducation.current}
              onChange={(e) => setNewEducation({ ...newEducation, current: e.target.checked })}
              className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 focus:ring-offset-0"
            />
            <span className="text-sm font-medium text-gray-700">Cursando atualmente</span>
          </label>
          
          <button
            onClick={handleAdd}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3.5 px-4 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-medium shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
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
