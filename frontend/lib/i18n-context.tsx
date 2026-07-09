'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import en from '../public/locales/en.json';
import hi from '../public/locales/hi.json';
import bn from '../public/locales/bn.json';
import ta from '../public/locales/ta.json';
import te from '../public/locales/te.json';
import mr from '../public/locales/mr.json';
import gu from '../public/locales/gu.json';
import pa from '../public/locales/pa.json';
import ml from '../public/locales/ml.json';
import kn from '../public/locales/kn.json';
import or from '../public/locales/or.json';
import as from '../public/locales/as.json';
import es from '../public/locales/es.json';

const translations = { en, hi, bn, ta, te, mr, gu, pa, ml, kn, or, as, es } as const;
export type Locale = keyof typeof translations;

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, fallback?: string) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    const stored = localStorage.getItem('aasha-locale');
    if (stored && Object.keys(translations).includes(stored)) {
      setLocaleState(stored as Locale);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('aasha-locale', newLocale);
  };

  const t = (key: string, fallback?: string): string => {
    const keys = key.split('.');
    let current: any = translations[locale];

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        // Fallback to english if not found in current locale
        let englishCurrent: any = translations['en'];
        for (const ek of keys) {
          if (englishCurrent && typeof englishCurrent === 'object' && ek in englishCurrent) {
            englishCurrent = englishCurrent[ek];
          } else {
            englishCurrent = undefined;
            break;
          }
        }
        if (typeof englishCurrent === 'string') {
          return englishCurrent;
        }
        return fallback || key;
      }
    }

    if (typeof current === 'string') {
      return current;
    }

    return fallback || key;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}
