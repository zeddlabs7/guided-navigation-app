import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { View, StyleSheet, I18nManager } from 'react-native';
import { useTranslation } from 'react-i18next';
import { loadSavedLanguage, setLanguage as persistLanguage } from '@/i18n';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  isRTL: boolean;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const [language, setLang] = useState<Language>('en');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    I18nManager.allowRTL(true);
    loadSavedLanguage().then((saved) => {
      setLang(saved);
      setIsLoading(false);
    });
  }, []);

  const setLanguage = useCallback(async (lang: Language) => {
    setLang(lang);
    await persistLanguage(lang);
  }, []);

  const toggleLanguage = useCallback(() => {
    const next = language === 'en' ? 'ar' : 'en';
    setLanguage(next);
  }, [language, setLanguage]);

  const isRTL = language === 'ar';

  return (
    <LanguageContext.Provider
      value={{
        language,
        isRTL,
        toggleLanguage,
        setLanguage,
        isLoading,
      }}
    >
      <View style={[styles.root, isRTL && styles.rtl]}>
        {children}
      </View>
    </LanguageContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    direction: 'ltr',
  },
  rtl: {
    direction: 'rtl',
  },
});

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
