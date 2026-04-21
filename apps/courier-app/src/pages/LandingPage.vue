<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useCourierSession } from '@/composables/useCourierSession';
import AddressDetailsSection from '@/components/AddressDetailsSection.vue';
import LocationCheckSection from '@/components/LocationCheckSection.vue';
import StepListSection from '@/components/StepListSection.vue';

const router = useRouter();
const route = useRoute();
const token = route.params.token as string;

const {
  guidanceSet,
  steps,
  currentLanguage,
  getDestinationCoordinates,
  getAvailabilityText,
  toggleLanguage,
} = useCourierSession();

onMounted(() => {
  if (!guidanceSet.value) {
    router.replace(`/g/${token}`);
  }
});

const scrollContainer = ref<HTMLDivElement | null>(null);

const isRtl = computed(() => currentLanguage.value === 'ar');

const availabilityText = computed(() => {
  const texts = getAvailabilityText();
  return isRtl.value ? texts.ar : texts.en;
});

const languageToggleLabel = computed(() => (isRtl.value ? 'English' : 'عربي'));

const destinationCoords = computed(() => getDestinationCoordinates());

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
    <div class="availability-banner" role="status">
      <svg class="availability-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M22 4L12 14.01l-3-3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span class="availability-text">{{ availabilityText }}</span>
    </div>

    <div class="landing-scroll" ref="scrollContainer">
      <AddressDetailsSection
        :guidance-set="guidanceSet"
        :is-rtl="isRtl"
        :language-toggle-label="languageToggleLabel"
        :on-toggle-language="toggleLanguage"
        :on-scroll-next="() => scrollToSection('landing-section-2')"
      />
      <LocationCheckSection
        :destination="destinationCoords"
        :is-rtl="isRtl"
        :on-scroll-next="() => scrollToSection('landing-section-3')"
        :on-scroll-prev="() => scrollToSection('landing-section-1')"
      />
      <StepListSection
        :steps="steps"
        :is-rtl="isRtl"
        :on-select-step="handleSelectStep"
        :on-scroll-prev="() => scrollToSection('landing-section-2')"
      />
    </div>
  </div>
</template>

<style scoped>
.landing-page {
  position: relative;
  height: 100dvh;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-background);
}

.availability-banner {
  flex-shrink: 0;
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
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.18);
  z-index: 20;
}

.availability-icon {
  color: white;
  flex-shrink: 0;
}

.availability-text {
  color: white;
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
