import { createI18n, useI18n } from 'vue-i18n';
import type { Language } from '@guidenav/types';
import { en } from './locales/en';
import { ar } from './locales/ar';

export function createI18nInstance(defaultLocale: Language = 'en') {
  return createI18n({
    legacy: false,
    locale: defaultLocale,
    fallbackLocale: 'en',
    // Type assertion needed due to vue-i18n's strict message typing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messages: { en, ar } as any,
  });
}

export function useAppI18n(): ReturnType<typeof useI18n> {
  return useI18n();
}
