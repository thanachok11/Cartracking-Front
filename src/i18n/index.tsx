import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import th from './locales/th.json';
import en from './locales/en.json';
import zh from './locales/zh.json';

type LangCode = 'th' | 'en' | 'zh';

type Dict = Record<string, string>;

const DICTS: Record<LangCode, Dict> = { th, en, zh } as const;

interface I18nContextValue {
  lang: LangCode;
  t: (key: string, vars?: Record<string, string | number | boolean | null | undefined>) => string;
  setLang: (lang: LangCode) => void;
  available: Array<{ code: LangCode; name: string }>;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<LangCode>(() => {
    const saved = localStorage.getItem('lang') as LangCode | null;
    return saved || 'th';
  });

  useEffect(() => {
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;
    
    // Load appropriate Google Fonts for each language
    const existingLink = document.getElementById('google-fonts');
    if (existingLink) {
      existingLink.remove();
    }
    
    const link = document.createElement('link');
    link.id = 'google-fonts';
    link.rel = 'stylesheet';
    
    switch (lang) {
      case 'th':
        link.href = 'https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&family=Prompt:wght@300;400;500;600;700&family=Kanit:wght@300;400;500;600;700&display=swap';
        break;
      case 'en':
        link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Roboto:wght@300;400;500;600;700&display=swap';
        break;
      case 'zh':
        link.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;600;700&display=swap';
        break;
      default:
        link.href = 'https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap';
    }
    
    document.head.appendChild(link);
  }, [lang]);

  const setLang = (l: LangCode) => setLangState(l);

  const dict = DICTS[lang];

  const t = useMemo(
    () => (key: string, vars?: Record<string, string | number | boolean | null | undefined>) => {
      const template = dict[key] ?? key;
      if (!vars) return template;
      return Object.keys(vars).reduce((acc, k) => acc.replace(new RegExp(`\\{${k}\\}`, 'g'), String(vars[k] ?? '')), template);
    },
    [dict]
  );

  const available = useMemo(
    () => [
      { code: 'th' as const, name: th['lang.name'] || 'ไทย' },
      { code: 'en' as const, name: en['lang.name'] || 'English' },
      { code: 'zh' as const, name: zh['lang.name'] || '中文' }
    ],
    []
  );

  const value = useMemo(() => ({ lang, t, setLang, available }), [lang, t, available]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
};
