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
  const [citySuggestions, setCitySuggestions] = useState<CitySuggestion[]>([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [isLoadingCity, setIsLoadingCity] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const cityDropdownRef = useRef<HTMLDivElement>(null);
  const cepTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const brazilianStates = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
    'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  const handleChange = (field: keyof PersonalInfo, value: string) => {
    updatePersonalInfo({ ...personalInfo, [field]: value });
  };

  const handleCepChange = (value: string) => {
    // Apply CEP mask: 00000-000 (8 digits total, hyphen after 5th)
    const digits = value.replace(/\D/g, '').slice(0, 8);
    const masked = digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
    handleChange('zipCode', masked);
    setCepError(null);

    if (cepTimeoutRef.current) {
      clearTimeout(cepTimeoutRef.current);
    }

    // Auto-fill address via ViaCEP if CEP is complete
    if (digits.length === 8) {
      cepTimeoutRef.current = setTimeout(() => {
        fetchAddressByCep(digits);
      }, 400);
    }
  };

  const fetchWithTimeout = (url: string, timeoutMs = 8000): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timeoutId));
  };

  const fetchAddressByCep = async (cep: string) => {
    try {
      const response = await fetchWithTimeout(`https://viacep.com.br/ws/${cep}/json/`);
      if (!response.ok) {
        setCepError('Não foi possível buscar o endereço. Tente novamente.');
        return;
      }
      const data = await response.json();

      if (data?.erro) {
        setCepError('CEP não encontrado. Verifique o número informado.');
        return;
      }

      handleChange('address', data.logradouro || '');
      handleChange('neighborhood', data.bairro || '');
      handleChange('city', data.localidade || '');
      handleChange('state', data.uf || '');
      setCepError(null);
    } catch (error) {
      setCepError('Erro ao consultar CEP. Preencha manualmente.');
      console.error('PersonalInfoForm: Error fetching address:', error);
    }
  };

  const handleCityChange = (value: string) => {
    handleChange('city', value);
    
    if (value.length >= 2) {
      fetchCitySuggestions(value);
    } else {
      setCitySuggestions([]);
      setShowCityDropdown(false);
    }
  };

  const fetchCitySuggestions = async (query: string) => {
    setIsLoadingCity(true);
    try {
      const response = await fetchWithTimeout(
        `https://servicodados.ibge.gov.br/api/v1/localidades/municipios?nome=${encodeURIComponent(query)}`
      );
      if (!response.ok) {
        throw new Error(`IBGE API error: ${response.status}`);
      }
      const data = await response.json();

      const suggestions = (Array.isArray(data) ? data : [])
        .filter((city: any) =>
          city?.microrregiao?.mesorregiao?.UF?.sigla === personalInfo.state || !personalInfo.state
        )
        .slice(0, 5)
        .map((city: any) => ({
          nome: city.nome || '',
          uf: city?.microrregiao?.mesorregiao?.UF?.sigla || '',
        }));

      setCitySuggestions(suggestions);
      setShowCityDropdown(suggestions.length > 0);
    } catch (error) {
      console.error('PersonalInfoForm: Error fetching city suggestions:', error);
      setCitySuggestions([]);
      setShowCityDropdown(false);
    } finally {
      setIsLoadingCity(false);
    }
  };

  const selectCity = (suggestion: CitySuggestion) => {
    handleChange('city', suggestion.nome);
    if (suggestion.uf) handleChange('state', suggestion.uf);
    setShowCityDropdown(false);
    setCitySuggestions([]);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target as Node)) {
        setShowCityDropdown(false);
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
        <label className="block text-sm font-semibold text-gray-900">CEP</label>
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            value={personalInfo.zipCode || ''}
            onChange={(e) => handleCepChange(e.target.value)}
            placeholder="00000-000"
            maxLength={9}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none transition-all duration-200 text-gray-900 placeholder-gray-500"
          />
        </div>
        {cepError && <p className="text-xs text-red-600 mt-1">{cepError}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="space-y-2 md:col-span-2">
          <label className="block text-sm font-semibold text-gray-900">Endereço</label>
          <input
            type="text"
            value={personalInfo.address || ''}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="Rua / Avenida"
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none transition-all duration-200 text-gray-900 placeholder-gray-500"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-900">Número</label>
          <input
            type="text"
            value={personalInfo.number || ''}
            onChange={(e) => handleChange('number', e.target.value)}
            placeholder="Nº"
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none transition-all duration-200 text-gray-900 placeholder-gray-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-900">Complemento</label>
          <input
            type="text"
            value={personalInfo.complement || ''}
            onChange={(e) => handleChange('complement', e.target.value)}
            placeholder="Apto, bloco, sala..."
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none transition-all duration-200 text-gray-900 placeholder-gray-500"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-900">Bairro</label>
          <input
            type="text"
            value={personalInfo.neighborhood || ''}
            onChange={(e) => handleChange('neighborhood', e.target.value)}
            placeholder="Bairro"
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none transition-all duration-200 text-gray-900 placeholder-gray-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-900">Cidade</label>
          <div className="relative" ref={cityDropdownRef}>
            <input
              type="text"
              value={personalInfo.city || ''}
              onChange={(e) => handleCityChange(e.target.value)}
              onFocus={() => setShowCityDropdown(true)}
              placeholder="Digite a cidade"
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none transition-all duration-200 text-gray-900 placeholder-gray-500"
            />
            
            {/* City Autocomplete Dropdown */}
            {showCityDropdown && citySuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                {citySuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => selectCity(suggestion)}
                    className="w-full px-4 py-3 text-left hover:bg-emerald-50 transition-colors flex items-center justify-between group"
                  >
                    <span className="text-gray-900">{suggestion.nome}</span>
                    <span className="text-sm text-gray-500 group-hover:text-emerald-600">{suggestion.uf}</span>
                  </button>
                ))}
              </div>
            )}
            
            {isLoadingCity && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 px-4 py-3 text-sm text-gray-500">
                Buscando cidades...
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-900">Estado (UF)</label>
          <div className="relative">
            <select
              value={personalInfo.state || ''}
              onChange={(e) => handleChange('state', e.target.value)}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none transition-all duration-200 text-gray-900 appearance-none cursor-pointer"
            >
              <option value="">Selecione</option>
              {brazilianStates.map((state) => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
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
