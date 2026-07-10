'use client'

import { User, Mail, Phone, MapPin, Globe } from 'lucide-react';
import { PersonalInfo } from '@/types/resume';
import { useResume } from '@/context/ResumeContext';

const PersonalInfoForm = () => {
  const { resume, updatePersonalInfo } = useResume();
  const { personalInfo } = resume;

  const handleChange = (field: keyof PersonalInfo, value: string) => {
    updatePersonalInfo({ ...personalInfo, [field]: value });
  };

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-white mb-6">Informações Pessoais</h2>
      
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-foreground">Nome Completo</label>
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={personalInfo.fullName}
            onChange={(e) => handleChange('fullName', e.target.value)}
            placeholder="Seu nome completo"
            className="w-full pl-12 pr-4 py-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200 text-foreground placeholder-muted-foreground"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-foreground">Email</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="email"
              value={personalInfo.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="seu@email.com"
              className="w-full pl-12 pr-4 py-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200 text-foreground placeholder-muted-foreground"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-foreground">Telefone</label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="tel"
              value={personalInfo.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="(00) 00000-0000"
              className="w-full pl-12 pr-4 py-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200 text-foreground placeholder-muted-foreground"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-foreground">Endereço</label>
        <div className="relative">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={personalInfo.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="Cidade, Estado"
            className="w-full pl-12 pr-4 py-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200 text-foreground placeholder-muted-foreground"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-foreground">LinkedIn</label>
          <div className="relative">
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="url"
              value={personalInfo.linkedin}
              onChange={(e) => handleChange('linkedin', e.target.value)}
              placeholder="linkedin.com/in/seu-perfil"
              className="w-full pl-12 pr-4 py-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200 text-foreground placeholder-muted-foreground"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-foreground">Website/Portfólio</label>
          <div className="relative">
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="url"
              value={personalInfo.website}
              onChange={(e) => handleChange('website', e.target.value)}
              placeholder="seusite.com"
              className="w-full pl-12 pr-4 py-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200 text-foreground placeholder-muted-foreground"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoForm;
