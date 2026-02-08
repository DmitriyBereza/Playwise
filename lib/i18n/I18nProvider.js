'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { messages } from './messages';

const I18nContext = createContext(null);
const LOCALE_KEY = 'playwiseLocale';

function resolvePath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

function interpolate(template, params) {
  if (typeof template !== 'string' || !params) {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (_, key) => (params[key] !== undefined ? String(params[key]) : `{${key}}`));
}

export function I18nProvider({ children }) {
  const [locale, setLocale] = useState('uk');

  useEffect(() => {
    const stored = window.localStorage.getItem(LOCALE_KEY);
    if (stored && messages[stored]) {
      setLocale(stored);
    }
  }, []);

  const value = useMemo(() => {
    const dictionary = messages[locale] || messages.uk;
    const fallback = messages.uk;

    const t = (key, params) => {
      const valueFromLocale = resolvePath(dictionary, key);
      const valueFromFallback = resolvePath(fallback, key);
      const resolved = valueFromLocale !== undefined ? valueFromLocale : valueFromFallback;
      return interpolate(resolved ?? key, params);
    };

    const changeLocale = (nextLocale) => {
      if (!messages[nextLocale]) {
        return;
      }
      setLocale(nextLocale);
      window.localStorage.setItem(LOCALE_KEY, nextLocale);
    };

    return {
      locale,
      setLocale: changeLocale,
      t,
      supportedLocales: Object.keys(messages),
    };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used inside I18nProvider');
  }
  return context;
}

