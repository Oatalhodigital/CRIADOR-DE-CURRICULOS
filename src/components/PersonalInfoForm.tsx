import React from 'react';
import { User, Mail, Phone, MapPin, Globe } from 'lucide-react';
import { PersonalInfo } from '../types/resume';
import { useResume } from '../context/ResumeContext';

const PersonalInfoForm: React.FC<{ onFocusTip?: (tip: string) => void }> = ({ onFocusTip }) => {
  const { resume, updatePersonalInfo } = useResume();
  const { personalInfo } = resume;

  const handleChange = (field: keyof PersonalInfo, value: string) => {
    updatePersonalInfo({ ...personalInfo, [field]: value });
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">Nome Completo</label>
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={personalInfo.fullName}
            onChange={(e) => handleChange('fullName', e.target.value)}
            onFocus={() => onFocusTip?.('Use seu nome completo como aparece em documentos oficiais. Evite apelidos.')}
            placeholder="Seu nome completo"
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all duration-200 text-gray-700 shadow-sm placeholder-gray-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Email</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              value={personalInfo.email}
              onChange={(e) => handleChange('email', e.target.value)}
              onFocus={() => onFocusTip?.('Use um e-mail profissional. Evite apelidos ou endereços informais.')}
              placeholder="seu@email.com"
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all duration-200 text-gray-700 shadow-sm placeholder-gray-400"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Telefone</label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="tel"
              value={personalInfo.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              onFocus={() => onFocusTip?.('Inclua o código de área (DDD). Use um número que você atende regularmente.')}
              placeholder="(00) 00000-0000"
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all duration-200 text-gray-700 shadow-sm placeholder-gray-400"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">Endereço</label>
        <div className="relative">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={personalInfo.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="Cidade, Estado"
            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent focus:bg-white transition-all duration-300 text-gray-900 placeholder-gray-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">LinkedIn</label>
          <div className="relative">
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="url"
              value={personalInfo.linkedin}
              onChange={(e) => handleChange('linkedin', e.target.value)}
              onFocus={() => onFocusTip?.('Use o URL completo do seu perfil LinkedIn. Mantenha-o atualizado.')}
              placeholder="linkedin.com/in/seu-perfil"
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all duration-200 text-gray-700 shadow-sm placeholder-gray-400"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Website/Portfólio</label>
          <div className="relative">
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="url"
              value={personalInfo.website}
              onChange={(e) => handleChange('website', e.target.value)}
              onFocus={() => onFocusTip?.('Link para seu portfólio ou site pessoal. Opcional, mas recomendado.')}
              placeholder="seusite.com"
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all duration-200 text-gray-700 shadow-sm placeholder-gray-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoForm;
