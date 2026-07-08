import React from 'react';
import { User, Mail, Phone, MapPin, Link, Globe } from 'lucide-react';
import { PersonalInfo } from '../types/resume';
import { useResume } from '../context/ResumeContext';

const PersonalInfoForm: React.FC = () => {
  const { resume, updatePersonalInfo } = useResume();
  const { personalInfo } = resume;

  const handleChange = (field: keyof PersonalInfo, value: string) => {
    updatePersonalInfo({ ...personalInfo, [field]: value });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <User className="w-6 h-6" />
        Dados Pessoais
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome Completo *
          </label>
          <input
            type="text"
            value={personalInfo.fullName}
            onChange={(e) => handleChange('fullName', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
            placeholder="João Silva"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email *
          </label>
          <input
            type="email"
            value={personalInfo.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
            placeholder="joao@email.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Telefone *
          </label>
          <input
            type="tel"
            value={personalInfo.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
            placeholder="(11) 99999-9999"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Endereço *
          </label>
          <input
            type="text"
            value={personalInfo.address}
            onChange={(e) => handleChange('address', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
            placeholder="São Paulo, SP"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
            <Link className="w-4 h-4" />
            LinkedIn
          </label>
          <input
            type="url"
            value={personalInfo.linkedin}
            onChange={(e) => handleChange('linkedin', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
            placeholder="linkedin.com/in/joaosilva"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Website/Portfólio
          </label>
          <input
            type="url"
            value={personalInfo.website}
            onChange={(e) => handleChange('website', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
            placeholder="www.joaosilva.com"
          />
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoForm;
