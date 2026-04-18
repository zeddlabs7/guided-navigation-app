import { ref, computed } from 'vue';
import type { GuidanceSet, GuidanceStep, ShareLink, Language } from '@guidenav/types';

const shareLink = ref<ShareLink | null>(null);
const guidanceSet = ref<GuidanceSet | null>(null);
const steps = ref<GuidanceStep[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);
const currentLanguage = ref<Language>('en');

export function useCourierSession() {
  const token = ref<string | null>(null);

  const totalSteps = computed(() => steps.value.length);

  const hasData = computed(() => guidanceSet.value !== null && steps.value.length > 0);

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
    steps.value = newSteps.sort((a, b) => a.stepIndex - b.stepIndex);
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

  function toggleLanguage() {
    currentLanguage.value = currentLanguage.value === 'en' ? 'ar' : 'en';
  }

  function setLanguage(lang: Language) {
    currentLanguage.value = lang;
  }

  function getAvailabilityText(): { en: string; ar: string } {
    if (!guidanceSet.value) {
      return { en: 'Available', ar: 'متاح' };
    }

    const { availabilityMode, availabilityStartTs, availabilityEndTs } = guidanceSet.value;

    if (availabilityMode === 'ANYTIME_TODAY') {
      return { en: 'Available Anytime Today', ar: 'متاح في أي وقت اليوم' };
    }

    if (availabilityMode === 'NOT_AVAILABLE_TODAY') {
      return { en: 'Not Available Today', ar: 'غير متاح اليوم' };
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
        ar: `متاح ${timeRange} اليوم`
      };
    }

    return { en: 'Available', ar: 'متاح' };
  }

  function clearSession() {
    shareLink.value = null;
    guidanceSet.value = null;
    steps.value = [];
    token.value = null;
    error.value = null;
    isLoading.value = false;
  }

  function getRecipientPhoneNumber(): string | null {
    return guidanceSet.value?.recipientPhoneNumber ?? null;
  }

  function getDestinationCoordinates(): { latitude: number; longitude: number } | null {
    return guidanceSet.value?.destinationCoordinates ?? null;
  }

  return {
    token,
    shareLink,
    guidanceSet,
    steps,
    isLoading,
    error,
    currentLanguage,
    totalSteps,
    hasData,
    lastStep,
    dropOffStep,
    setToken,
    setSession,
    setLoading,
    setError,
    getStepByIndex,
    toggleLanguage,
    setLanguage,
    getAvailabilityText,
    clearSession,
    getRecipientPhoneNumber,
    getDestinationCoordinates,
  };
}
