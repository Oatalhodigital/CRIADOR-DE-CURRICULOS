import { Resume } from '@/types/resume';

interface ResumePreviewProps {
  resume: Resume;
}

const ResumePreview = ({ resume }: ResumePreviewProps) => {
  const { personalInfo, experience, education, skills, summary } = resume;

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const [year, month] = dateString.split('-');
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return months[parseInt(month) - 1] + ' ' + year;
  };

  return (
    <div className="w-[210mm] min-h-[297mm] bg-white p-10 shadow-2xl text-black mx-auto print:shadow-none print:p-8 print:w-full print:min-h-full font-sans rounded-sm" style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)' }}>
      {/* Header - ATS Friendly */}
      <div className="border-b-2 border-black pb-4 mb-6">
        <h1 className="text-3xl font-bold text-black tracking-normal mb-1 uppercase">
          {personalInfo.fullName || 'SEU NOME'}
        </h1>
        <div className="text-sm text-black space-y-1 mt-3">
          <p className="flex flex-wrap gap-x-3 gap-y-1">
            {personalInfo.email && <span>{personalInfo.email}</span>}
            {personalInfo.phone && (
              <>
                <span className="text-gray-400">|</span>
                <span>{personalInfo.phone}</span>
              </>
            )}
            {personalInfo.address && (
              <>
                <span className="text-gray-400">|</span>
                <span>{personalInfo.address}</span>
              </>
            )}
          </p>
          <p className="flex flex-wrap gap-x-3 gap-y-1">
            {personalInfo.linkedin && <span>{personalInfo.linkedin}</span>}
            {personalInfo.website && personalInfo.linkedin && <span className="text-gray-400">|</span>}
            {personalInfo.website && <span>{personalInfo.website}</span>}
          </p>
        </div>
      </div>

      {/* Professional Summary */}
      {summary && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-black uppercase mb-2 border-b border-gray-300 pb-1">
            Resumo Profissional
          </h2>
          <p className="text-sm text-black leading-relaxed">
            {summary}
          </p>
        </div>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-black uppercase mb-3 border-b border-gray-300 pb-1">
            Experiência Profissional
          </h2>
          {experience.map((exp) => (
            <div key={exp.id} className="mb-4">
              <div className="flex justify-between items-baseline">
                <h3 className="font-bold text-black text-sm">
                  {exp.company}
                </h3>
                <span className="text-sm text-black">
                  {formatDate(exp.startDate)} - {exp.current ? 'Atual' : formatDate(exp.endDate || '')}
                </span>
              </div>
              <p className="text-sm text-black font-semibold mb-1">
                {exp.position}
              </p>
              <p className="text-sm text-black leading-relaxed whitespace-pre-line">
                {exp.description}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {education && education.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-black uppercase mb-3 border-b border-gray-300 pb-1">
            Educação
          </h2>
          {education.map((edu) => (
            <div key={edu.id} className="mb-3">
              <div className="flex justify-between items-baseline">
                <h3 className="font-bold text-black text-sm">
                  {edu.institution}
                </h3>
                <span className="text-sm text-black">
                  {formatDate(edu.startDate)} - {edu.current ? 'Atual' : formatDate(edu.endDate || '')}
                </span>
              </div>
              <p className="text-sm text-black">
                {edu.degree} em {edu.field}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-black uppercase mb-3 border-b border-gray-300 pb-1">
            Habilidades
          </h2>
          <p className="text-sm text-black">
            {skills.map((skill) => skill.name).join(' • ')}
          </p>
        </div>
      )}

      {/* Empty State */}
      {!personalInfo.fullName && experience.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-gray-400 text-center text-sm">
            Preencha os dados no formulário para ver o preview do seu currículo
          </p>
        </div>
      )}
    </div>
  );
};

export default ResumePreview;
