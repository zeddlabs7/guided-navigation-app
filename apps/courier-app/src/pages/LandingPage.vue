<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useCourierSession } from '@/composables/useCourierSession';
import type { Language } from '@guidenav/types';
import AddressDetailsSection from '@/components/AddressDetailsSection.vue';
import StepListSection from '@/components/StepListSection.vue';

const router = useRouter();
const route = useRoute();
const token = route.params.token as string;

const {
  guidanceSet,
  steps,
  currentLanguage,
  isRtl,
  getDestinationCoordinates,
  getDestinationAddress,
  getLocationCheckImageUrl,
  getAvailabilityText,
  setLanguage,
  translateUserContent,
} = useCourierSession();

const languageOptions: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'العربية' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'ur', label: 'اردو' },
  { code: 'bn', label: 'বাংলা' },
];
const showLanguageMenu = ref(false);
const currentLanguageLabel = computed(() =>
  languageOptions.find(l => l.code === currentLanguage.value)?.label || 'English'
);

async function handleLanguageSelect(lang: Language) {
  showLanguageMenu.value = false;
  if (lang === currentLanguage.value) return;
  setLanguage(lang);
  if (lang !== 'en') {
    await translateUserContent();
  }
}

function closeLanguageMenu(e: MouseEvent) {
  if (!(e.target as HTMLElement).closest('.language-picker')) {
    showLanguageMenu.value = false;
  }
}

onMounted(() => document.addEventListener('click', closeLanguageMenu));
onBeforeUnmount(() => document.removeEventListener('click', closeLanguageMenu));

onMounted(() => {
  if (!guidanceSet.value) {
    router.replace(`/g/${token}`);
  }
});

const scrollContainer = ref<HTMLDivElement | null>(null);

const availabilityText = computed(() => {
  const texts = getAvailabilityText();
  return texts[currentLanguage.value];
});

const destinationCoords = computed(() => getDestinationCoordinates());

const hasSteps = computed(() => steps.value.length > 0);

const destinationAddress = computed(() => getDestinationAddress());

const locationCheckImageUrl = computed(() => getLocationCheckImageUrl());

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({
    behavior: prefersReducedMotion ? 'auto' : 'smooth',
    block: 'start',
  });
}

function handleSelectStep(index: number) {
  router.push(`/g/${token}/step/${index}`);
}
</script>

<template>
  <div v-if="guidanceSet" class="landing-page" :dir="isRtl ? 'rtl' : 'ltr'">
    <div class="sticky-top">
      <div class="availability-banner" role="status">
        <svg class="availability-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M22 4L12 14.01l-3-3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="availability-text">{{ availabilityText }}</span>
      </div>

      <header class="app-header">
        <div class="brand">
          <img
            :src="isRtl ? '/logo-ar.png' : '/logo-eng.png'"
            alt="Arriveo"
            class="brand-logo"
          />
        </div>
        <div class="language-picker">
          <button class="language-picker-btn" type="button" @click="showLanguageMenu = !showLanguageMenu">
            {{ currentLanguageLabel }}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <div v-if="showLanguageMenu" class="language-menu">
            <button
              v-for="opt in languageOptions"
              :key="opt.code"
              class="language-menu-item"
              :class="{ active: currentLanguage === opt.code }"
              :dir="opt.code === 'ar' || opt.code === 'ur' ? 'rtl' : 'ltr'"
              @click="handleLanguageSelect(opt.code)"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
      </header>
    </div>

    <div class="landing-scroll" ref="scrollContainer">
      <AddressDetailsSection
        :guidance-set="guidanceSet"
        :is-rtl="isRtl"
        :destination="destinationCoords"
        :destination-address="destinationAddress"
        :location-check-image-url="locationCheckImageUrl"
        :has-steps="hasSteps"
        :on-view-steps="() => scrollToSection('landing-section-2')"
      />
      <StepListSection
        :steps="steps"
        :is-rtl="isRtl"
        :on-select-step="handleSelectStep"
        :on-scroll-prev="() => scrollToSection('landing-section-1')"
      />
    </div>
  </div>
</template>

<style scoped>
.landing-page {
  position: relative;
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-background);
}

.sticky-top {
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 30;
}

.availability-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: calc(env(safe-area-inset-top) + 8px) 12px 8px;
  background-color: #16a34a;
  color: white;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.availability-icon {
  color: white;
  flex-shrink: 0;
}

.availability-text {
  color: white;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm) var(--spacing-lg);
  background-color: white;
  border-bottom: 1px solid var(--color-border);
}

.brand {
  display: flex;
  align-items: center;
}

.brand-logo {
  height: 32px;
  width: auto;
  object-fit: contain;
}

.language-picker {
  position: relative;
  flex-shrink: 0;
}

.language-picker-btn {
  padding: 6px 12px;
  border-radius: var(--radius-full);
  border: 2px solid var(--color-primary);
  background-color: white;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-primary);
  cursor: pointer;
  line-height: 1.4;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
}

.language-menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  min-width: 140px;
  background: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
  z-index: 50;
  overflow: hidden;
}

[dir="rtl"] .language-menu {
  right: auto;
  left: 0;
}

.language-menu-item {
  display: block;
  width: 100%;
  padding: 10px 16px;
  border: none;
  background: none;
  font-size: 15px;
  font-weight: 500;
  color: var(--color-text);
  cursor: pointer;
  text-align: start;
  transition: background-color 0.1s ease;
}

.language-menu-item:hover {
  background-color: var(--color-primary-light);
}

.language-menu-item.active {
  color: var(--color-primary);
  font-weight: 700;
  background-color: var(--color-primary-light);
}

.landing-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  scroll-snap-type: y mandatory;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
}

@media (prefers-reduced-motion: reduce) {
  .landing-scroll {
    scroll-behavior: auto;
  }
}
</style>
