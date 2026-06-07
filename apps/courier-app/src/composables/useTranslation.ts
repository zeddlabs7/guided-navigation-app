import translations from '@/i18n/translations';
import type { TranslationKey } from '@/i18n/translations';
import { useCourierSession } from './useCourierSession';

export function useTranslation() {
  const { currentLanguage } = useCourierSession();

  function t(key: TranslationKey): string {
    const entry = translations[key];
    if (!entry) return key;
    return entry[currentLanguage.value] || entry.en;
  }

  return { t };
}
