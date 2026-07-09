import React, { useRef } from 'react';
import { useResume } from '../context/ResumeContext';

const ResumePreview: React.FC = () => {
  const { resume } = useResume();
  const previewRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={previewRef}
      className="resume-print-container w-[210mm] min-h-[297mm] bg-white p-12 shadow-2xl rounded-sm text-gray-800 mx-auto"
      style={{ 
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Header */}
      <div className="border-b-2 border-gray-900 pb-6 mb-8">
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-4">
          {resume.personalInfo.fullName || 'Seu Nome'}
        </h1>
        <div className="text-sm text-gray-600 space-y-1">
          <p className="flex items-center gap-2">
            <span>{resume.personalInfo.email || 'email@exemplo.com'}</span>
            <span className="text-gray-300">•</span>
            <span>{resume.personalInfo.phone || '(00) 00000-0000'}</span>
          </p>
          <p>{resume.personalInfo.address || 'Cidade, Estado'}</p>
        </div>
      </div>

      {/* Professional Summary */}
      {resume.summary && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3 pb-2 border-b border-gray-200">
            Resumo Profissional
          </h2>
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
            {resume.summary}
          </p>
        </div>
      )}

      {/* Experience */}
      {resume.experience.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
            Experiência Profissional
          </h2>
          <div className="space-y-6">
            {resume.experience.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-semibold text-gray-900">{exp.position}</h3>
                  <span className="text-sm text-gray-600">
                    {exp.startDate} - {exp.current ? 'Atual' : exp.endDate}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-700 mb-2">{exp.company}</p>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{exp.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {resume.education.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
            Formação Acadêmica
          </h2>
          <div className="space-y-4">
            {resume.education.map((edu) => (
              <div key={edu.id}>
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-semibold text-gray-900">{edu.degree}</h3>
                  <span className="text-sm text-gray-600">
                    {edu.startDate} - {edu.current ? 'Atual' : edu.endDate}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{edu.institution}</p>
                {edu.field && <p className="text-sm text-gray-600">{edu.field}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {resume.skills.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
            Habilidades
          </h2>
          <div className="flex flex-wrap gap-2">
            {resume.skills.map((skill) => (
              <span
                key={skill.id}
                className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
              >
                {skill.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumePreview;
