import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { View, StyleSheet, I18nManager, NativeModules, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { loadSavedLanguage, setLanguage as persistLanguage } from '@/i18n';
import { updateUser } from '@/services/users';
import type { User } from '@guidenav/types';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  isRTL: boolean;
  toggleLanguage: () => void;
  setLanguage: (lang: Language, uid?: string) => void;
  syncLanguageFromFirestore: (user: User) => void;
  isSwitchingLanguage: boolean;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

function reloadApp() {
  if (Platform.OS === 'web') return;
  NativeModules.DevSettings?.reload?.();
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const [language, setLang] = useState<Language>('en');
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitchingLanguage, setIsSwitchingLanguage] = useState(false);

  useEffect(() => {
    I18nManager.allowRTL(true);
    loadSavedLanguage().then((saved) => {
      const rtl = saved === 'ar';

      I18nManager.forceRTL(rtl);

      console.log('[RTL CHECK]', {
        isRTL: I18nManager.isRTL,
        swap: I18nManager.doLeftAndRightSwapInRTL,
        savedLang: saved,
        rtlNeeded: rtl,
      });

      if (I18nManager.isRTL !== rtl) {
        setIsSwitchingLanguage(true);
        setTimeout(reloadApp, 300);
        return;
      }

      setLang(saved);
      setIsLoading(false);
    });
  }, []);

  const setLanguage = useCallback(async (lang: Language, uid?: string) => {
    const rtl = lang === 'ar';
    if (lang === (I18nManager.isRTL ? 'ar' : 'en')) {
      setLang(lang);
      await persistLanguage(lang);
      if (uid) {
        updateUser(uid, { languagePreference: lang }).catch(console.error);
      }
      return;
    }

    setIsSwitchingLanguage(true);
    setLang(lang);
    await persistLanguage(lang);

    if (uid) {
      try {
        await updateUser(uid, { languagePreference: lang });
      } catch (e) {
        console.error('Failed to save language to Firestore:', e);
      }
    }

    I18nManager.forceRTL(rtl);
    setTimeout(reloadApp, 300);
  }, []);

  const toggleLanguage = useCallback(() => {
    const next = language === 'en' ? 'ar' : 'en';
    setLanguage(next);
  }, [language, setLanguage]);

  const syncLanguageFromFirestore = useCallback((user: User) => {
    const firestoreLang = user.languagePreference as Language;
    if (firestoreLang && firestoreLang !== language && (firestoreLang === 'en' || firestoreLang === 'ar')) {
      setLanguage(firestoreLang);
    }
  }, [language, setLanguage]);

  const isRTL = language === 'ar';

  return (
    <LanguageContext.Provider
      value={{
        language,
        isRTL,
        toggleLanguage,
        setLanguage,
        syncLanguageFromFirestore,
        isSwitchingLanguage,
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
