import React, { useState } from 'react';
import { GraduationCap, Plus, Trash2 } from 'lucide-react';
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

  const handleAdd = () => {
    if (newEducation.institution && newEducation.degree) {
      addEducation({
        id: Date.now().toString(),
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
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <GraduationCap className="w-6 h-6" />
        Formação Acadêmica
      </h2>

      {education.map((edu) => (
        <div key={edu.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800">{edu.degree}</h3>
              <p className="text-sm text-gray-600">{edu.institution}</p>
              <p className="text-sm text-gray-500">{edu.field}</p>
            </div>
            <button
              onClick={() => removeEducation(edu.id)}
              className="text-red-500 hover:text-red-700 transition"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-gray-600">
            {edu.startDate} - {edu.current ? 'Atual' : edu.endDate}
          </p>
        </div>
      ))}

      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
        <h3 className="font-semibold text-purple-800 mb-3">Adicionar Formação</h3>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Instituição *"
            value={newEducation.institution}
            onChange={(e) => setNewEducation({ ...newEducation, institution: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
          />
          <input
            type="text"
            placeholder="Grau/Diploma *"
            value={newEducation.degree}
            onChange={(e) => setNewEducation({ ...newEducation, degree: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
          />
          <input
            type="text"
            placeholder="Área de Estudo"
            value={newEducation.field}
            onChange={(e) => setNewEducation({ ...newEducation, field: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="month"
              value={newEducation.startDate}
              onChange={(e) => setNewEducation({ ...newEducation, startDate: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
            />
            <input
              type="month"
              value={newEducation.endDate}
              onChange={(e) => setNewEducation({ ...newEducation, endDate: e.target.value })}
              disabled={newEducation.current}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition disabled:bg-gray-100"
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={newEducation.current}
              onChange={(e) => setNewEducation({ ...newEducation, current: e.target.checked })}
              className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
            />
            <span className="text-sm text-gray-700">Cursando atualmente</span>
          </label>
          <button
            onClick={handleAdd}
            className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Adicionar Formação
          </button>
        </div>
      </div>
    </div>
  );
};

export default EducationForm;
