import React, { useRef } from 'react';
import { useResume } from '../context/ResumeContext';
import { Lock, Download, Sparkles, FileText } from 'lucide-react';
import html2pdf from 'html2pdf.js';

const ResumePreview: React.FC<{ onGeneratePDF: () => void }> = ({ onGeneratePDF }) => {
  const { resume } = useResume();
  const previewRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!previewRef.current) return;

    const element = previewRef.current;
    const opt = {
      margin: 0,
      filename: `${resume.personalInfo.fullName.replace(/\s+/g, '_')}_curriculo.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in' as const, format: 'letter' as const, orientation: 'portrait' as const },
    };

    await html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-600" />
          <span className="text-sm font-semibold text-gray-600">Preview em Tempo Real</span>
        </div>
        {!resume.paid ? (
          <button
            onClick={onGeneratePDF}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-indigo-500/20 flex items-center gap-2 font-medium text-sm"
          >
            <Lock className="w-4 h-4" />
            Gerar PDF
          </button>
        ) : (
          <button
            onClick={handleDownload}
            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-5 py-2.5 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg shadow-green-500/20 flex items-center gap-2 font-medium text-sm"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        )}
      </div>

      {/* A4 Paper Preview */}
      <div className="relative">
        <div
          ref={previewRef}
          className="w-[210mm] min-h-[297mm] bg-white p-12 shadow-2xl rounded-sm text-gray-800 transition-all duration-300 transform hover:shadow-3xl mx-auto"
          style={{ 
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          {/* Paywall Overlay */}
          {!resume.paid && (
            <div className="absolute inset-0 flex flex-col items-center justify-center backdrop-blur-sm bg-white/40 z-10">
              <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-8 text-center border border-gray-200 shadow-2xl max-w-md mx-4">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
                  <Lock className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Design Profissional Pronto</h3>
                <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                  Libere a versão final sem marcas d'água por apenas R$ 8,98
                </p>
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold text-sm shadow-lg shadow-indigo-500/20">
                  <Sparkles className="w-4 h-4" />
                  R$ 8,98
                </div>
              </div>
            </div>
          )}

          {/* Resume Content */}
          <div className="space-y-8">
            {/* Header */}
            <div className="border-b-2 border-gray-900 pb-6">
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
                {(resume.personalInfo.linkedin || resume.personalInfo.website) && (
                  <p className="flex items-center gap-2">
                    {resume.personalInfo.linkedin && <span className="text-blue-600">{resume.personalInfo.linkedin}</span>}
                    {resume.personalInfo.linkedin && resume.personalInfo.website && <span className="text-gray-300">•</span>}
                    {resume.personalInfo.website && <span className="text-blue-600">{resume.personalInfo.website}</span>}
                  </p>
                )}
              </div>
            </div>

            {/* Summary */}
            {resume.summary && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-3 uppercase tracking-wider border-l-4 border-indigo-600 pl-3">
                  Resumo Profissional
                </h2>
                <p className="text-gray-700 text-base leading-relaxed">
                  {resume.summary}
                </p>
              </div>
            )}

            {/* Experience */}
            {resume.experience.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wider border-l-4 border-indigo-600 pl-3">
                  Experiência Profissional
                </h2>
                {resume.experience.map((exp) => (
                  <div key={exp.id} className="mb-5">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {exp.position}
                        </h3>
                        <p className="text-base text-gray-700 font-medium">
                          {exp.company}
                        </p>
                      </div>
                      <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                        {exp.startDate} - {exp.current ? 'Atual' : exp.endDate}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-2 leading-relaxed">
                      {exp.description}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Education */}
            {resume.education.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wider border-l-4 border-indigo-600 pl-3">
                  Formação Acadêmica
                </h2>
                {resume.education.map((edu) => (
                  <div key={edu.id} className="mb-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {edu.degree}
                        </h3>
                        <p className="text-base text-gray-700 font-medium">
                          {edu.institution}
                        </p>
                        {edu.field && <p className="text-sm text-gray-600">{edu.field}</p>}
                      </div>
                      <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                        {edu.startDate} - {edu.current ? 'Atual' : edu.endDate}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Skills */}
            {resume.skills.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wider border-l-4 border-indigo-600 pl-3">
                  Habilidades
                </h2>
                <div className="flex flex-wrap gap-2">
                  {resume.skills.map((skill) => (
                    <span
                      key={skill.id}
                      className="px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-800 rounded-lg text-sm font-medium border border-indigo-200"
                    >
                      {skill.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumePreview;
