'use client'

import { useState, useEffect, useRef } from 'react';
import { User, Mail, Phone, MapPin, Globe, ChevronDown } from 'lucide-react';
import { PersonalInfo } from '@/types/resume';
import { useResume } from '@/context/ResumeContext';

interface CitySuggestion {
  nome: string;
  uf: string;
}

const PersonalInfoForm = () => {
  const { resume, updatePersonalInfo } = useResume();
  const { personalInfo } = resume;
  const [addressSuggestions, setAddressSuggestions] = useState<CitySuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleChange = (field: keyof PersonalInfo, value: string) => {
    updatePersonalInfo({ ...personalInfo, [field]: value });
  };

  // Fetch city suggestions from IBGE API
  const fetchCitySuggestions = async (query: string) => {
    if (query.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://servicodados.ibge.gov.br/api/v1/localidades/municipios?nome=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      const suggestions = data.slice(0, 10).map((city: any) => ({
        nome: city.nome,
        uf: city.microrregiao.mesorregiao.UF.sigla,
      }));
      setAddressSuggestions(suggestions);
    } catch (error) {
      console.error('Error fetching city suggestions:', error);
      setAddressSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddressChange = (value: string) => {
    handleChange('address', value);
    fetchCitySuggestions(value);
    setShowSuggestions(true);
  };

  const handleSelectSuggestion = (suggestion: CitySuggestion) => {
    const formattedAddress = `${suggestion.nome}, ${suggestion.uf}`;
    handleChange('address', formattedAddress);
    setShowSuggestions(false);
    setAddressSuggestions([]);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Informações Pessoais</h2>
      
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-900">Nome Completo</label>
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={personalInfo.fullName}
            onChange={(e) => handleChange('fullName', e.target.value)}
            placeholder="Seu nome completo"
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none transition-all duration-200 text-gray-900 placeholder-gray-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-900">Email</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="email"
              value={personalInfo.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="seu@email.com"
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none transition-all duration-200 text-gray-900 placeholder-gray-500"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-900">Telefone</label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="tel"
              value={personalInfo.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="(00) 00000-0000"
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none transition-all duration-200 text-gray-900 placeholder-gray-500"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-900">Endereço</label>
        <div className="relative" ref={dropdownRef}>
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 z-10" />
          <input
            type="text"
            value={personalInfo.address}
            onChange={(e) => handleAddressChange(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Digite a cidade (ex: São Paulo)"
            className="w-full pl-12 pr-10 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none transition-all duration-200 text-gray-900 placeholder-gray-500"
          />
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          
          {/* Autocomplete Dropdown */}
          {showSuggestions && addressSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
              {addressSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelectSuggestion(suggestion)}
                  className="w-full px-4 py-3 text-left hover:bg-emerald-50 transition-colors flex items-center justify-between group"
                >
                  <span className="text-gray-900">{suggestion.nome}</span>
                  <span className="text-sm text-gray-500 group-hover:text-emerald-600">{suggestion.uf}</span>
                </button>
              ))}
            </div>
          )}
          
          {isLoading && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 px-4 py-3 text-sm text-gray-500">
              Buscando cidades...
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-900">LinkedIn</label>
          <div className="relative">
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="url"
              value={personalInfo.linkedin}
              onChange={(e) => handleChange('linkedin', e.target.value)}
              placeholder="linkedin.com/in/seu-perfil"
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none transition-all duration-200 text-gray-900 placeholder-gray-500"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-900">
            Website/Portfólio <span className="text-gray-400 font-normal">(Opcional)</span>
          </label>
          <div className="relative">
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="url"
              value={personalInfo.website}
              onChange={(e) => handleChange('website', e.target.value)}
              placeholder="seusite.com"
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none transition-all duration-200 text-gray-900 placeholder-gray-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoForm;
