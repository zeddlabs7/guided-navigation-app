import { ref, computed } from 'vue';
import type { GuidanceSet, GuidanceStep, ShareLink, Language, CourierContactPreference } from '@guidenav/types';
import { loadGuidanceData, translateTexts } from '@guidenav/services/courier-api';

const SUPPORTED_LANGUAGES: Language[] = ['en', 'ar', 'hi', 'ur', 'bn'];

const shareLink = ref<ShareLink | null>(null);
const guidanceSet = ref<GuidanceSet | null>(null);
const allSteps = ref<GuidanceStep[]>([]);
const steps = ref<GuidanceStep[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);
const currentLanguage = ref<Language>('en');
const recipientPhoneNumber = ref<string | null>(null);
const courierContactPreference = ref<CourierContactPreference | null>(null);
const translatedContent = ref<Record<string, string>>({});
const isTranslating = ref(false);
const isTokenValid = ref(false);
const isDataLoading = ref(false);
const dataLoadError = ref<string | null>(null);

export function useCourierSession() {
  const token = ref<string | null>(null);

  const totalSteps = computed(() => steps.value.length);

  const hasData = computed(() => guidanceSet.value !== null && steps.value.length > 0);
  const isDataReady = computed(() => guidanceSet.value !== null && steps.value.length > 0 && !isDataLoading.value);

  const lastStep = computed(() => {
    if (steps.value.length === 0) return null;
    return steps.value[steps.value.length - 1];
  });

  const dropOffStep = computed(() => {
    return steps.value.find(step => step.stepType === 'DROP_OFF_POINT') ?? lastStep.value;
  });

  function setToken(newToken: string) {
    token.value = newToken;
  }

  function setSession(
    newShareLink: ShareLink,
    newGuidanceSet: GuidanceSet,
    newSteps: GuidanceStep[]
  ) {
    shareLink.value = newShareLink;
    guidanceSet.value = newGuidanceSet;
    // Store all steps for coordinate lookup
    allSteps.value = newSteps.sort((a, b) => a.stepIndex - b.stepIndex);
    // Filter out LOCATION_CHECK steps for display as they're handled by Open Maps on the landing page
    steps.value = allSteps.value.filter(step => step.stepType !== 'LOCATION_CHECK');
    error.value = null;
  }

  function setLoading(loading: boolean) {
    isLoading.value = loading;
  }

  function setError(err: string | null) {
    error.value = err;
  }

  function getStepByIndex(index: number): GuidanceStep | null {
    return steps.value[index] ?? null;
  }

  const isRtl = computed(() => currentLanguage.value === 'ar' || currentLanguage.value === 'ur');

  function toggleLanguage() {
    const langs: Language[] = ['en', 'ar', 'hi', 'ur', 'bn'];
    const idx = langs.indexOf(currentLanguage.value);
    currentLanguage.value = langs[(idx + 1) % langs.length];
  }

  function setLanguage(lang: Language) {
    currentLanguage.value = lang;
    try { localStorage.setItem('arriveo_lang', lang); } catch {}
    const rtl = lang === 'ar' || lang === 'ur';
    document.documentElement.lang = lang;
    document.documentElement.dir = rtl ? 'rtl' : 'ltr';
  }

  function getSavedLanguage(): Language | null {
    try {
      const saved = localStorage.getItem('arriveo_lang');
      if (saved && SUPPORTED_LANGUAGES.includes(saved as Language)) {
        return saved as Language;
      }
    } catch {}
    return null;
  }

  function detectLanguage(): Language | null {
    const saved = getSavedLanguage();
    if (saved) return saved;

    try {
      const browserLang = navigator.language?.toLowerCase() ?? '';
      for (const lang of SUPPORTED_LANGUAGES) {
        if (browserLang === lang || browserLang.startsWith(lang + '-')) {
          return lang;
        }
      }
    } catch {}
    return null;
  }

  function getAvailabilityText(): Record<Language, string> {
    if (!guidanceSet.value) {
      return { en: 'Available', ar: 'متاح', hi: 'उपलब्ध', ur: 'دستیاب', bn: 'উপলব্ধ' };
    }

    const { availabilityMode, availabilityStartTs, availabilityEndTs } = guidanceSet.value;

    if (availabilityMode === 'ANYTIME_TODAY') {
      return {
        en: 'Available Anytime Today',
        ar: 'متاح في أي وقت اليوم',
        hi: 'आज कभी भी उपलब्ध',
        ur: 'آج کسی بھی وقت دستیاب',
        bn: 'আজ যেকোনো সময় উপলব্ধ',
      };
    }

    if (availabilityMode === 'NOT_AVAILABLE_TODAY') {
      return {
        en: 'Not Available Today',
        ar: 'غير متاح اليوم',
        hi: 'आज उपलब्ध नहीं',
        ur: 'آج دستیاب نہیں',
        bn: 'আজ উপলব্ধ নয়',
      };
    }

    if (availabilityMode === 'TIME_WINDOW' && availabilityStartTs && availabilityEndTs) {
      const start = new Date(availabilityStartTs);
      const end = new Date(availabilityEndTs);
      const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      };
      const timeRange = `${formatTime(start)}–${formatTime(end)}`;
      return {
        en: `Available ${timeRange} Today`,
        ar: `متاح ${timeRange} اليوم`,
        hi: `आज ${timeRange} उपलब्ध`,
        ur: `آج ${timeRange} دستیاب`,
        bn: `আজ ${timeRange} উপলব্ধ`,
      };
    }

    return { en: 'Available', ar: 'متاح', hi: 'उपलब्ध', ur: 'دستیاب', bn: 'উপলব্ধ' };
  }

  function getContactPreferenceShortText(): Record<Language, string> {
    if (courierContactPreference.value === 'NO_CALL_LEAVE_PHOTO') {
      return {
        en: '🔕 NO CALL · LEAVE & SEND PHOTO',
        ar: '🔕 لا اتصال · اترك وأرسل صورة',
        hi: '🔕 कॉल नहीं · छोड़ें और फ़ोटो भेजें',
        ur: '🔕 کال نہیں · چھوڑیں اور تصویر بھیجیں',
        bn: '🔕 কল নয় · রেখে দিন ও ছবি পাঠান',
      };
    }
    return {
      en: '📞 CALL ON ARRIVAL',
      ar: '📞 اتصل عند الوصول',
      hi: '📞 पहुँचने पर कॉल करें',
      ur: '📞 پہنچنے پر کال کریں',
      bn: '📞 পৌঁছালে কল করুন',
    };
  }

  function getContactPreferenceLongText(): Record<Language, string> {
    if (courierContactPreference.value === 'NO_CALL_LEAVE_PHOTO') {
      return {
        en: 'NO CALL — Leave the shipment and send a delivery photo',
        ar: 'لا اتصال — اترك الشحنة وأرسل صورة التسليم',
        hi: 'कॉल नहीं — शिपमेंट छोड़ें और डिलीवरी फ़ोटो भेजें',
        ur: 'کال نہیں — شپمنٹ چھوڑیں اور ڈیلیوری تصویر بھیجیں',
        bn: 'কল নয় — চালান রেখে দিন এবং ডেলিভারি ছবি পাঠান',
      };
    }
    return {
      en: 'CALL ON ARRIVAL',
      ar: 'اتصل عند الوصول',
      hi: 'पहुँचने पर कॉल करें',
      ur: 'پہنچنے پر کال کریں',
      bn: 'পৌঁছালে কল করুন',
    };
  }

  function getCourierContactPreference(): CourierContactPreference | null {
    return courierContactPreference.value;
  }

  const needsTranslation = computed(() => {
    return currentLanguage.value !== 'en';
  });

  async function translateUserContent() {
    const lang = currentLanguage.value;
    if (lang === 'en') return;

    const textsToTranslate: { key: string; text: string }[] = [];

    steps.value.forEach((step, i) => {
      const stored = step.instructionTranslations?.[lang];
      if (!stored) {
        const source = step.instructionOriginal;
        if (source) {
          textsToTranslate.push({ key: `step_instruction_${i}`, text: source });
        }
      }
      if (step.title) {
        textsToTranslate.push({ key: `step_title_${i}`, text: step.title });
      }
    });

    allSteps.value.forEach((step, i) => {
      if (step.stepType === 'LOCATION_CHECK') {
        const stored = step.instructionTranslations?.[lang];
        if (!stored) {
          const source = step.instructionOriginal;
          if (source) {
            textsToTranslate.push({ key: `allstep_instruction_${i}`, text: source });
          }
        }
      }
    });

    // Don't machine-translate guidance title — use titleArabic if available, otherwise show English

    if (textsToTranslate.length === 0) return;

    isTranslating.value = true;
    try {
      const result = await translateTexts(textsToTranslate, lang);
      translatedContent.value = { ...translatedContent.value, ...result };
    } catch (err) {
      console.error('Translation failed, falling back to original:', err);
    } finally {
      isTranslating.value = false;
    }
  }

  function getStepInstruction(step: GuidanceStep, index: number): string {
    const lang = currentLanguage.value;
    if (lang === 'en') return step.instructionOriginal || '';

    const stored = step.instructionTranslations?.[lang];
    if (stored) return stored;

    const key = `step_instruction_${index}`;
    return translatedContent.value[key] || step.instructionOriginal || '';
  }

  function getStepTitle(step: GuidanceStep, index: number): string {
    const lang = currentLanguage.value;
    if (!step.title) return '';
    if (lang === 'en') return step.title;

    const key = `step_title_${index}`;
    return translatedContent.value[key] || step.title;
  }

  function getGuidanceTitle(): string {
    const gs = guidanceSet.value;
    const title = gs?.title || 'Yadul';
    const lang = currentLanguage.value;
    if (lang === 'ar') {
      const arTitle = gs?.titleArabic?.replace(/[\u200F\u200E\u200B\u00A0\s]/g, '');
      if (arTitle) return gs!.titleArabic!;
    }
    return title;
  }

  function setTokenValid(valid: boolean) {
    isTokenValid.value = valid;
  }

  async function loadDataInBackground(tokenValue: string) {
    isDataLoading.value = true;
    dataLoadError.value = null;

    try {
      const result = await loadGuidanceData(tokenValue);

      if (!result.valid || !result.shareLink || !result.guidanceSet || !result.steps) {
        dataLoadError.value = result.error || 'LOAD_FAILED';
        return;
      }

      if (result.recipientPhoneNumber) {
        recipientPhoneNumber.value = result.recipientPhoneNumber;
      }
      courierContactPreference.value = result.courierContactPreference ?? 'CALL_ON_ARRIVAL';

      setSession(result.shareLink, result.guidanceSet, result.steps);
    } catch (err) {
      console.error('Background data load failed:', err);
      dataLoadError.value = 'LOAD_FAILED';
    } finally {
      isDataLoading.value = false;
    }
  }

  function clearSession() {
    shareLink.value = null;
    guidanceSet.value = null;
    allSteps.value = [];
    steps.value = [];
    token.value = null;
    error.value = null;
    isLoading.value = false;
    isTokenValid.value = false;
    isDataLoading.value = false;
    dataLoadError.value = null;
    recipientPhoneNumber.value = null;
    courierContactPreference.value = null;
    translatedContent.value = {};
    isTranslating.value = false;
  }

  function setRecipientPhoneNumber(phone: string | null) {
    recipientPhoneNumber.value = phone;
  }

  function getRecipientPhoneNumber(): string | null {
    return recipientPhoneNumber.value;
  }

  function getDestinationCoordinates(): { latitude: number; longitude: number } | null {
    // First, try to get coordinates from a LOCATION_CHECK step (more precise)
    const locationCheckStep = allSteps.value.find(step => step.stepType === 'LOCATION_CHECK');
    if (locationCheckStep?.locationData?.coordinates) {
      return locationCheckStep.locationData.coordinates;
    }
    
    // Fallback to guidance set destination coordinates
    return guidanceSet.value?.destinationCoordinates ?? null;
  }

  function getDestinationAddress(): string | null {
    const locationCheckStep = allSteps.value.find(step => step.stepType === 'LOCATION_CHECK');
    return locationCheckStep?.locationData?.formattedAddress ?? null;
  }

  function getLocationCheckImageUrl(): string | null {
    const locationCheckStep = allSteps.value.find(step => step.stepType === 'LOCATION_CHECK');
    return locationCheckStep?.image?.publicUrl ?? null;
  }

  function saveLastStep(stepIndex: number) {
    const gsId = guidanceSet.value?.id;
    if (!gsId) return;
    try { localStorage.setItem(`arriveo_step_${gsId}`, String(stepIndex)); } catch {}
  }

  function getLastStep(): number {
    const gsId = guidanceSet.value?.id;
    if (!gsId) return 0;
    try {
      const saved = localStorage.getItem(`arriveo_step_${gsId}`);
      if (saved !== null) {
        const idx = parseInt(saved, 10);
        if (!isNaN(idx) && idx >= 0 && idx < steps.value.length) return idx;
      }
    } catch {}
    return 0;
  }

  return {
    token,
    shareLink,
    guidanceSet,
    steps,
    isLoading,
    isTranslating,
    isTokenValid,
    isDataLoading,
    isDataReady,
    dataLoadError,
    error,
    currentLanguage,
    isRtl,
    needsTranslation,
    totalSteps,
    hasData,
    lastStep,
    dropOffStep,
    setToken,
    setTokenValid,
    setSession,
    setLoading,
    setError,
    loadDataInBackground,
    getStepByIndex,
    toggleLanguage,
    setLanguage,
    translateUserContent,
    getStepInstruction,
    getStepTitle,
    getGuidanceTitle,
    getAvailabilityText,
    getContactPreferenceShortText,
    getContactPreferenceLongText,
    getCourierContactPreference,
    courierContactPreference,
    clearSession,
    setRecipientPhoneNumber,
    getRecipientPhoneNumber,
    getDestinationCoordinates,
    getDestinationAddress,
    getLocationCheckImageUrl,
    detectLanguage,
    getSavedLanguage,
    saveLastStep,
    getLastStep,
  };
}
