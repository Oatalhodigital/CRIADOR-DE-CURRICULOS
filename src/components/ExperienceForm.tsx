import React, { useState } from 'react';
import { Briefcase, Plus, Trash2 } from 'lucide-react';
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

  const handleAdd = () => {
    if (newExperience.company && newExperience.position) {
      addExperience({
        id: Date.now().toString(),
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
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <Briefcase className="w-6 h-6" />
        Experiência Profissional
      </h2>

      {experience.map((exp) => (
        <div key={exp.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800">{exp.position}</h3>
              <p className="text-sm text-gray-600">{exp.company}</p>
            </div>
            <button
              onClick={() => removeExperience(exp.id)}
              className="text-red-500 hover:text-red-700 transition"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-gray-600">
            {exp.startDate} - {exp.current ? 'Atual' : exp.endDate}
          </p>
          <p className="text-sm text-gray-700 mt-2">{exp.description}</p>
        </div>
      ))}

      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
        <h3 className="font-semibold text-purple-800 mb-3">Adicionar Experiência</h3>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Empresa *"
            value={newExperience.company}
            onChange={(e) => setNewExperience({ ...newExperience, company: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
          />
          <input
            type="text"
            placeholder="Cargo *"
            value={newExperience.position}
            onChange={(e) => setNewExperience({ ...newExperience, position: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="month"
              value={newExperience.startDate}
              onChange={(e) => setNewExperience({ ...newExperience, startDate: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
            />
            <input
              type="month"
              value={newExperience.endDate}
              onChange={(e) => setNewExperience({ ...newExperience, endDate: e.target.value })}
              disabled={newExperience.current}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition disabled:bg-gray-100"
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={newExperience.current}
              onChange={(e) => setNewExperience({ ...newExperience, current: e.target.checked })}
              className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
            />
            <span className="text-sm text-gray-700">Emprego atual</span>
          </label>
          <textarea
            placeholder="Descrição das responsabilidades e conquistas"
            value={newExperience.description}
            onChange={(e) => setNewExperience({ ...newExperience, description: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition resize-none"
          />
          <button
            onClick={handleAdd}
            className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Adicionar Experiência
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExperienceForm;
