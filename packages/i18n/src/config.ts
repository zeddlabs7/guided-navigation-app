import { createI18n, useI18n } from 'vue-i18n';
import type { Language } from '@guidenav/types';
import { en } from './locales/en';
import { ar } from './locales/ar';
import type { LocaleMessages } from './types';

const messages: Record<Language, LocaleMessages> = {
  en,
  ar,
};

export function createI18nInstance(defaultLocale: Language = 'en') {
  return createI18n({
    legacy: false,
    locale: defaultLocale,
    fallbackLocale: 'en',
    messages,
  });
}

export function useAppI18n() {
  return useI18n<{ message: LocaleMessages }>();
}
