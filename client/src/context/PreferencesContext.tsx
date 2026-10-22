"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  Language,
  Currency,
  TRANSLATIONS,
  CURRENCY_RATES,
} from "../lib/translations";

interface PreferencesContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  currency: Currency;
  setCurrency: (curr: Currency) => void;
  formatPrice: (amountLKR: number | string) => string;
  formatCurrency: (amountLKR: number | string, customCurrency?: Currency) => string;
  t: (key: string, fallback?: string) => string;
  preferencesOpen: boolean;
  setPreferencesOpen: (open: boolean) => void;
  openPreferences: () => void;
  closePreferences: () => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("EN");
  const [currency, setCurrencyState] = useState<Currency>("LKR");
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Hydrate preferences from localStorage upon client mount
  useEffect(() => {
    setMounted(true);
    try {
      const savedLang = localStorage.getItem("aurelle_language") as Language;
      if (savedLang && ["EN", "SI", "TA", "FR"].includes(savedLang)) {
        setLanguageState(savedLang);
        document.documentElement.lang = savedLang.toLowerCase();
      }

      const savedCurr = localStorage.getItem("aurelle_currency") as Currency;
      if (savedCurr && ["LKR", "USD", "EUR", "GBP"].includes(savedCurr)) {
        setCurrencyState(savedCurr);
      }
    } catch (e) {
      // Ignore storage access errors
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("aurelle_language", lang);
      document.documentElement.lang = lang.toLowerCase();
    } catch (e) {}
  };

  const setCurrency = (curr: Currency) => {
    setCurrencyState(curr);
    try {
      localStorage.setItem("aurelle_currency", curr);
    } catch (e) {}
  };

  const formatPrice = (amountLKR: number | string): string => {
    let num: number;
    if (typeof amountLKR === "string") {
      const cleaned = amountLKR.replace(/[^0-9.-]/g, "");
      num = parseFloat(cleaned);
      if (isNaN(num)) return amountLKR;
    } else {
      num = amountLKR;
    }
    const config = CURRENCY_RATES[currency] || CURRENCY_RATES.LKR;
    return config.format(num);
  };

  const formatCurrency = (amountLKR: number | string, customCurrency?: Currency): string => {
    let num: number;
    if (typeof amountLKR === "string") {
      const cleaned = amountLKR.replace(/[^0-9.-]/g, "");
      num = parseFloat(cleaned);
      if (isNaN(num)) return amountLKR;
    } else {
      num = amountLKR;
    }
    const config = CURRENCY_RATES[customCurrency || currency] || CURRENCY_RATES.LKR;
    return config.format(num);
  };

  const t = (key: string, fallback?: string): string => {
    const entry = TRANSLATIONS[key];
    if (entry && entry[language]) {
      return entry[language];
    }
    return fallback || entry?.EN || key;
  };

  const openPreferences = () => setPreferencesOpen(true);
  const closePreferences = () => setPreferencesOpen(false);

  return (
    <PreferencesContext.Provider
      value={{
        language,
        setLanguage,
        currency,
        setCurrency,
        formatPrice,
        formatCurrency,
        t,
        preferencesOpen,
        setPreferencesOpen,
        openPreferences,
        closePreferences,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesContextType {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }
  return context;
}
