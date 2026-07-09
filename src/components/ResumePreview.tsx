import React from 'react';

interface ResumeData {
  nome: string;
  cargo: string;
  email: string;
  telefone: string;
  cidade: string;
  experiencia: string;
}

interface ResumePreviewProps {
  resumeData: ResumeData;
}

const ResumePreview: React.FC<ResumePreviewProps> = ({ resumeData }) => {
  return (
    <div className="w-[210mm] min-h-[297mm] bg-white p-12 shadow-2xl rounded-sm text-[#0F172A] mx-auto print:shadow-none print:rounded-none print:p-8 print:w-full print:min-h-full">
      {/* Header */}
      <div className="border-b-2 border-[#0F172A] pb-6 mb-8">
        <h1 className="text-4xl font-bold text-[#0F172A] tracking-tight mb-4">
          {resumeData.nome || 'Seu Nome'}
        </h1>
        <div className="text-sm text-gray-600 space-y-1">
          <p className="flex items-center gap-2">
            <span>{resumeData.email || 'email@exemplo.com'}</span>
            <span className="text-gray-300">•</span>
            <span>{resumeData.telefone || '(00) 00000-0000'}</span>
          </p>
          <p>{resumeData.cidade || 'Cidade, Estado'}</p>
        </div>
      </div>

      {/* Professional Summary */}
      {resumeData.experiencia && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-[#0F172A] mb-3 pb-2 border-b border-gray-200">
            Resumo Profissional
          </h2>
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
            {resumeData.experiencia}
          </p>
        </div>
      )}
    </div>
  );
};

export default ResumePreview;
