import { Resume, Experience, Education, Skill } from '@/types/resume';

interface ResumePreviewProps {
  resume: Resume;
  draftExperience?: Partial<Experience> | null;
  draftEducation?: Partial<Education> | null;
  draftSkill?: Partial<Skill> | null;
  isPaid?: boolean;
}

const ResumePreview = ({ resume, draftExperience, draftEducation, draftSkill, isPaid = false }: ResumePreviewProps) => {
  const { personalInfo, experience, education, skills, languages, summary } = resume;

  // Combine existing items with draft items for real-time preview
  const allExperience = draftExperience ? [...experience, draftExperience as Experience] : experience;
  const allEducation = draftEducation ? [...education, draftEducation as Education] : education;
  const allSkills = draftSkill ? [...skills, draftSkill as Skill] : skills;

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const [year, month] = dateString.split('-');
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return months[parseInt(month) - 1] + ' ' + year;
  };

  return (
    <div className="relative">
      {/* Watermark overlay for unpaid users */}
      {!isPaid && (
        <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm"></div>
          <div className="relative text-center transform -rotate-45 opacity-20">
            <p className="text-6xl font-bold text-gray-400 tracking-wider">NÃO PAGO</p>
            <p className="text-2xl text-gray-400 mt-2">Pré-visualização</p>
          </div>
        </div>
      )}

      <div className={`w-[210mm] min-h-[297mm] bg-white p-10 shadow-2xl text-black mx-auto print:shadow-none print:p-8 print:w-full print:min-h-full font-sans rounded-sm ${!isPaid ? 'blur-[2px]' : ''}`} style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)' }}>
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
          </p>
          <p className="flex flex-wrap gap-x-3 gap-y-1">
            {personalInfo.address && <span>{personalInfo.address}</span>}
            {personalInfo.city && personalInfo.address && <span className="text-gray-400">|</span>}
            {personalInfo.city && <span>{personalInfo.city}</span>}
            {personalInfo.state && personalInfo.city && <span className="text-gray-400">-</span>}
            {personalInfo.state && <span>{personalInfo.state}</span>}
            {personalInfo.zipCode && (personalInfo.city || personalInfo.state) && <span className="text-gray-400">|</span>}
            {personalInfo.zipCode && <span>CEP: {personalInfo.zipCode}</span>}
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
      {allExperience.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-black uppercase mb-3 border-b border-gray-300 pb-1">
            Experiência Profissional
          </h2>
          {allExperience.map((exp, index) => (
            <div key={exp.id || `draft-${index}`} className="mb-4">
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
      {allEducation && allEducation.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-black uppercase mb-3 border-b border-gray-300 pb-1">
            Educação
          </h2>
          {allEducation.map((edu, index) => (
            <div key={edu.id || `draft-${index}`} className="mb-3">
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
              {edu.description && (
                <p className="text-sm text-black leading-relaxed mt-1">
                  {edu.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {allSkills.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-black uppercase mb-3 border-b border-gray-300 pb-1">
            Habilidades e Competências
          </h2>
          <p className="text-sm text-black">
            {allSkills.map((skill) => skill.name).join(' • ')}
          </p>
        </div>
      )}

      {/* Languages */}
      {languages && languages.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-black uppercase mb-3 border-b border-gray-300 pb-1">
            Idiomas
          </h2>
          <p className="text-sm text-black">
            {languages.map((lang) => `${lang.name} (${lang.proficiency})`).join(' • ')}
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
    </div>
  );
};

export default ResumePreview;
