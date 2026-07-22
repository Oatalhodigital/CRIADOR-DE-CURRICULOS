'use client';

import { useLanguage } from '@/context/LanguageContext';
import { Language } from '@/lib/i18n';

const labels: Record<Language, string> = {
  pt: 'PT',
  en: 'EN',
  es: 'ES',
};

interface LanguageSelectorProps {
  className?: string;
}

const LanguageSelector = ({ className = '' }: LanguageSelectorProps) => {
  const { lang, setLang } = useLanguage();

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {(Object.keys(labels) as Language[]).map((code) => (
        <button
          key={code}
          onClick={() => setLang(code)}
          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
            lang === code
              ? 'bg-emerald-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          aria-label={`Idioma ${labels[code]}`}
        >
          {labels[code]}
        </button>
      ))}
    </div>
  );
};

export default LanguageSelector;
