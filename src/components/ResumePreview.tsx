'use client';

import { Resume, Experience, Education, Skill } from '@/types/resume';
import { useEffect, useRef, useState } from 'react';
import { Lock, Shield } from 'lucide-react';

interface ResumePreviewProps {
  resume: Resume;
  draftExperience?: Partial<Experience> | null;
  draftEducation?: Partial<Education> | null;
  draftSkill?: Partial<Skill> | null;
  isPaid?: boolean;
  price?: number;
  onContinueToPayment?: () => void;
}

const ResumePreview = ({
  resume,
  draftExperience,
  draftEducation,
  draftSkill,
  isPaid = false,
  price = 10,
  onContinueToPayment,
}: ResumePreviewProps) => {
  const { personalInfo, experience, education, skills, languages, summary } = resume;

  // Combine existing items with draft items for real-time preview
  const allExperience = draftExperience ? [...experience, draftExperience as Experience] : experience;
  const allEducation = draftEducation ? [...education, draftEducation as Education] : education;
  const allSkills = draftSkill ? [...skills, draftSkill as Skill] : skills;

  const isPaidRef = useRef(isPaid);
  useEffect(() => {
    isPaidRef.current = isPaid;
  }, [isPaid]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPaidRef.current) return;
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P' || e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        window.alert('Impressão e download estão disponíveis após a compra.');
      }
    };

    const handleBeforePrint = () => {
      if (!isPaidRef.current) {
        window.alert('Finalize a compra para baixar ou imprimir o currículo completo.');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('beforeprint', handleBeforePrint);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('beforeprint', handleBeforePrint);
    };
  }, []);

  const formatPrice = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const [year, month] = dateString.split('-');
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return months[parseInt(month) - 1] + ' ' + year;
  };

  return (
    <div className="relative">
      {!isPaid && (
        <div className="hidden print:flex flex-col items-center justify-center p-12 text-center bg-white text-gray-700 min-h-[297mm]">
          <Lock className="w-12 h-12 text-emerald-600 mb-4" />
          <p className="font-semibold text-lg mb-2">Currículo protegido</p>
          <p>Finalize a compra para baixar ou imprimir seu currículo completo.</p>
        </div>
      )}

      <div
        className={`w-[210mm] min-h-[297mm] bg-white p-10 shadow-2xl text-black mx-auto print:shadow-none print:p-8 print:w-full print:min-h-full font-sans rounded-sm relative ${!isPaid ? 'select-none print:hidden' : ''}`}
        style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)' }}
        onContextMenu={!isPaid ? (e) => e.preventDefault() : undefined}
        onCopy={!isPaid ? (e) => e.preventDefault() : undefined}
      >
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
            {personalInfo.number && <span>Nº {personalInfo.number}</span>}
            {personalInfo.complement && <span>{personalInfo.complement}</span>}
            {personalInfo.neighborhood && <span>{personalInfo.neighborhood}</span>}
            {personalInfo.city && <span>{personalInfo.city}</span>}
            {personalInfo.state && <span>{personalInfo.state}</span>}
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

      {!isPaid && (
        <>
          <div
            className="absolute inset-x-0 top-[45%] bottom-0 z-10 bg-gradient-to-b from-white/10 via-white/80 to-white/95 backdrop-blur-[3px] pointer-events-auto select-none"
            aria-hidden="true"
          />
          <div className="absolute inset-x-0 top-[55%] z-20 flex flex-col items-center justify-start px-6 pointer-events-auto select-text">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xl max-w-sm text-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Preview parcial</h3>
              <p className="text-sm text-gray-600 mb-4">
                Veja a primeira parte do seu currículo. Finalize a compra para visualizar e baixar a versão completa.
              </p>
              <div className="text-2xl font-bold text-emerald-600 mb-2">
                {price && price > 0 ? formatPrice(price) : 'Escolha seu plano'}
              </div>
              <p className="text-xs text-gray-500 mb-4">Pagamento único — sem assinatura</p>
              {onContinueToPayment && (
                <button
                  onClick={onContinueToPayment}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg transition-colors"
                >
                  Ir para pagamento
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ResumePreview;
