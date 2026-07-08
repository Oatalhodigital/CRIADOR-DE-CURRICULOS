import React, { useRef } from 'react';
import { useResume } from '../context/ResumeContext';
import { Lock, Download, Sparkles } from 'lucide-react';
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-600" />
          Preview Premium
        </h2>
        {!resume.paid ? (
          <button
            onClick={onGeneratePDF}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2 font-semibold"
          >
            <Lock className="w-5 h-5" />
            Liberar PDF
          </button>
        ) : (
          <button
            onClick={handleDownload}
            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2 font-semibold"
          >
            <Download className="w-5 h-5" />
            Download PDF
          </button>
        )}
      </div>

      <div
        ref={previewRef}
        className="bg-white p-10 rounded-xl shadow-2xl border border-gray-200 min-h-[800px] relative overflow-hidden"
        style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
      >
        {!resume.paid && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-purple-900/90 via-indigo-900/90 to-blue-900/90 backdrop-blur-sm z-10">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 text-center border border-white/20 shadow-2xl">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Versão Premium</h3>
              <p className="text-white/80 mb-4">Desbloqueie o download sem marca d'água</p>
              <div className="inline-block bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 px-6 py-2 rounded-full font-bold text-lg">
                R$ 8,98
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="border-b-2 border-gray-900 pb-6 mb-8">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">{resume.personalInfo.fullName || 'Seu Nome'}</h1>
          <div className="mt-4 text-sm text-gray-600 space-y-1">
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
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-3 uppercase tracking-wider border-l-4 border-purple-600 pl-3">
              Resumo Profissional
            </h2>
            <p className="text-gray-700 text-base leading-relaxed">{resume.summary}</p>
          </div>
        )}

        {/* Experience */}
        {resume.experience.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wider border-l-4 border-purple-600 pl-3">
              Experiência Profissional
            </h2>
            {resume.experience.map((exp) => (
              <div key={exp.id} className="mb-5">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-lg">{exp.position}</h3>
                    <p className="text-base text-gray-700 font-medium">{exp.company}</p>
                  </div>
                  <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                    {exp.startDate} - {exp.current ? 'Atual' : exp.endDate}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mt-2 leading-relaxed">{exp.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Education */}
        {resume.education.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wider border-l-4 border-purple-600 pl-3">
              Formação Acadêmica
            </h2>
            {resume.education.map((edu) => (
              <div key={edu.id} className="mb-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-lg">{edu.degree}</h3>
                    <p className="text-base text-gray-700 font-medium">{edu.institution}</p>
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
            <h2 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wider border-l-4 border-purple-600 pl-3">
              Habilidades
            </h2>
            <div className="flex flex-wrap gap-2">
              {resume.skills.map((skill) => (
                <span
                  key={skill.id}
                  className="px-4 py-2 bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-800 rounded-lg text-sm font-medium border border-purple-200"
                >
                  {skill.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumePreview;
