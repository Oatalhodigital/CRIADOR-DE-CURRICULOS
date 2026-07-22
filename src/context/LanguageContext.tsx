'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Language, translations, t as translate } from '@/lib/i18n';

type TranslationsType = typeof translations.pt;

interface LanguageContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Language>('pt');

  const setLang = useCallback((next: Language) => {
    setLangState(next);
  }, []);

  const t = useCallback(
    (key: string) => translate(lang, key),
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
