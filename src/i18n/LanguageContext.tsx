import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  LocaleCode,
  LOCALES,
  TRANSLATIONS,
  LearnXTranslations,
} from './translations';

interface LanguageContextValue {
  locale: LocaleCode;
  setLocale: (code: LocaleCode) => void;
  t: LearnXTranslations;
}

const SHARED_LOCALE_KEY = 'lp_locale';
const POLISATLAS_LOCALE_KEY = 'polisatlas_locale_v1';

function detectInitialLocale(): LocaleCode {
  try {
    const params = new URLSearchParams(window.location.search);
    const urlLang = params.get('lang')?.trim().toLowerCase() as LocaleCode | null;
    if (urlLang && TRANSLATIONS[urlLang]) return urlLang;

    const saved = (localStorage.getItem(SHARED_LOCALE_KEY) ||
      localStorage.getItem(POLISATLAS_LOCALE_KEY)) as LocaleCode | null;
    if (saved && TRANSLATIONS[saved]) return saved;

    const nav = navigator.language?.toLowerCase() ?? 'en';
    if (nav.startsWith('fr')) return 'fr';
    if (nav.startsWith('de')) return 'de';
    if (nav.startsWith('zh')) return 'zh';
    if (nav.startsWith('ja')) return 'ja';
  } catch {
    // ignore
  }
  return 'en';
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: 'en',
  setLocale: () => {},
  t: TRANSLATIONS.en,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [locale, setLocaleState] = useState<LocaleCode>(() =>
    detectInitialLocale()
  );

  const setLocale = (code: LocaleCode) => {
    setLocaleState(code);
    try {
      localStorage.setItem(SHARED_LOCALE_KEY, code);
      localStorage.setItem(POLISATLAS_LOCALE_KEY, code);
      document.documentElement.lang = code;
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <LanguageContext.Provider
      value={{
        locale,
        setLocale,
        t: TRANSLATIONS[locale] ?? TRANSLATIONS.en,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage() {
  return useContext(LanguageContext);
}

export { LOCALES };
export type { LocaleCode };
