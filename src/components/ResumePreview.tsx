import React, { useRef } from 'react';
import { useResume } from '../context/ResumeContext';
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
        <h2 className="text-2xl font-bold text-gray-800">Preview</h2>
        {!resume.paid ? (
          <button
            onClick={onGeneratePDF}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
          >
            Gerar PDF
          </button>
        ) : (
          <button
            onClick={handleDownload}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
          >
            Download PDF
          </button>
        )}
      </div>

      <div
        ref={previewRef}
        className="bg-white p-8 rounded-lg shadow-lg border border-gray-200 min-h-[800px] relative"
      >
        {!resume.paid && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-400 mb-2">MARCA D'ÁGUA</p>
              <p className="text-gray-400">Faça o pagamento para remover</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="border-b-2 border-gray-800 pb-4 mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{resume.personalInfo.fullName}</h1>
          <div className="mt-2 text-sm text-gray-600 space-y-1">
            <p>{resume.personalInfo.email} • {resume.personalInfo.phone}</p>
            <p>{resume.personalInfo.address}</p>
            {(resume.personalInfo.linkedin || resume.personalInfo.website) && (
              <p>
                {resume.personalInfo.linkedin && <span>{resume.personalInfo.linkedin}</span>}
                {resume.personalInfo.linkedin && resume.personalInfo.website && <span> • </span>}
                {resume.personalInfo.website && <span>{resume.personalInfo.website}</span>}
              </p>
            )}
          </div>
        </div>

        {/* Summary */}
        {resume.summary && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2 uppercase tracking-wide">Resumo</h2>
            <p className="text-gray-700 text-sm leading-relaxed">{resume.summary}</p>
          </div>
        )}

        {/* Experience */}
        {resume.experience.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3 uppercase tracking-wide">Experiência Profissional</h2>
            {resume.experience.map((exp) => (
              <div key={exp.id} className="mb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">{exp.position}</h3>
                    <p className="text-sm text-gray-700">{exp.company}</p>
                  </div>
                  <span className="text-sm text-gray-600">
                    {exp.startDate} - {exp.current ? 'Atual' : exp.endDate}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mt-1">{exp.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Education */}
        {resume.education.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3 uppercase tracking-wide">Formação Acadêmica</h2>
            {resume.education.map((edu) => (
              <div key={edu.id} className="mb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">{edu.degree}</h3>
                    <p className="text-sm text-gray-700">{edu.institution}</p>
                    {edu.field && <p className="text-sm text-gray-600">{edu.field}</p>}
                  </div>
                  <span className="text-sm text-gray-600">
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
            <h2 className="text-lg font-bold text-gray-900 mb-3 uppercase tracking-wide">Habilidades</h2>
            <div className="flex flex-wrap gap-2">
              {resume.skills.map((skill) => (
                <span
                  key={skill.id}
                  className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm"
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
