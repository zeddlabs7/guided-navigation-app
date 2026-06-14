<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ArrowOverlay, MarkerOverlay } from '@guidenav/ui';
import { STEP_TYPE_LABELS, type Language } from '@guidenav/types';
import { useCourierSession } from '@/composables/useCourierSession';
import { useTranslation } from '@/composables/useTranslation';
import FeedbackModal from '@/components/FeedbackModal.vue';

const router = useRouter();
const route = useRoute();
const { t } = useTranslation();

const token = computed(() => route.params.token as string);
const currentIndex = computed(() => parseInt(route.params.index as string, 10));

const {
  guidanceSet,
  totalSteps,
  currentLanguage,
  isRtl,
  getStepByIndex,
  getStepInstruction,
  getStepTitle,
  getGuidanceTitle,
  getAvailabilityText,
  setLanguage,
  translateUserContent,
} = useCourierSession();

const showFeedbackModal = ref(false);
const imageLoaded = ref(false);
const imageError = ref(false);

onMounted(() => {
  if (!guidanceSet.value) {
    router.replace(`/g/${token.value}`);
  }
});

const currentStep = computed(() => getStepByIndex(currentIndex.value));
const isFirstStep = computed(() => currentIndex.value === 0);
const isLastStep = computed(() => currentIndex.value === totalSteps.value - 1);

const nextStepImageUrl = computed(() => {
  if (isLastStep.value) return null;
  const next = getStepByIndex(currentIndex.value + 1);
  return next?.image?.publicUrl ?? null;
});

const availabilityText = computed(() => {
  const texts = getAvailabilityText();
  return texts[currentLanguage.value];
});

const stepTypeLabel = computed(() => {
  if (!currentStep.value) return '';
  const labels = STEP_TYPE_LABELS[currentStep.value.stepType];
  return labels[currentLanguage.value];
});

const stepTitle = computed(() => {
  if (!currentStep.value) return '';
  return getStepTitle(currentStep.value, currentIndex.value);
});

const stepInstruction = computed(() => {
  if (!currentStep.value) return '';
  return getStepInstruction(currentStep.value, currentIndex.value);
});

const overlayCount = computed(() => {
  return currentStep.value?.overlays?.length ?? 0;
});

const guidanceTitle = computed(() => {
  return getGuidanceTitle();
});

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
  const target = e.target as HTMLElement;
  if (!target.closest('.header-language-picker')) {
    showLanguageMenu.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', closeLanguageMenu);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', closeLanguageMenu);
});

watch(() => route.params.index, () => {
  imageLoaded.value = false;
  imageError.value = false;

  if (nextStepImageUrl.value) {
    const img = new Image();
    img.src = nextStepImageUrl.value;
  }
}, { immediate: true });

function handlePrevious() {
  if (!isFirstStep.value) {
    router.push(`/g/${token.value}/step/${currentIndex.value - 1}`);
  }
}

function handleNext() {
  if (isLastStep.value) {
    router.push(`/g/${token.value}/complete`);
  } else {
    router.push(`/g/${token.value}/step/${currentIndex.value + 1}`);
  }
}

function handleCantFind() {
  showFeedbackModal.value = true;
}

function handleFeedbackClose() {
  showFeedbackModal.value = false;
}

function handleBackToLanding() {
  router.push(`/g/${token.value}/landing`);
}

function handleHome() {
  router.push(`/g/${token.value}/landing`);
}

function handleImageLoad() {
  imageLoaded.value = true;
}

function handleImageError() {
  imageError.value = true;
}
</script>

<template>
  <div class="playback-page" :dir="isRtl ? 'rtl' : 'ltr'">
    <!-- Header -->
    <header class="playback-header">
      <button class="header-back" @click="handleBackToLanding" :aria-label="t('back')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <span class="header-title">{{ guidanceTitle }}</span>
      <div class="header-actions">
        <button class="header-home" @click="handleHome" :aria-label="t('home')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1h-5v-7h-6v7H4a1 1 0 01-1-1V9.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <div class="header-language-picker">
          <button class="header-language" @click="showLanguageMenu = !showLanguageMenu">
            {{ currentLanguageLabel }}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <div v-if="showLanguageMenu" class="language-dropdown">
            <button
              v-for="opt in languageOptions"
              :key="opt.code"
              class="language-dropdown-item"
              :class="{ active: currentLanguage === opt.code }"
              @click="handleLanguageSelect(opt.code)"
            >{{ opt.label }}</button>
          </div>
        </div>
      </div>
    </header>

    <!-- Availability Banner -->
    <div class="availability-banner">
      <svg class="availability-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M22 4L12 14.01l-3-3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span class="availability-text">{{ availabilityText }}</span>
    </div>

    <!-- Main Content -->
    <main class="playback-content">
      <!-- Image Container -->
      <div class="image-container">
        <!-- Step Image -->
        <div v-if="currentStep?.image?.publicUrl" class="step-image-wrapper">
          <img
            :src="currentStep.image.publicUrl"
            :alt="stepTitle"
            class="step-image"
            :class="{ 'step-image--loaded': imageLoaded }"
            @load="handleImageLoad"
            @error="handleImageError"
          />
          
          <!-- Overlays -->
          <div v-if="imageLoaded" class="overlays-container">
            <template v-for="overlay in currentStep?.overlays" :key="overlay.id">
              <ArrowOverlay
                v-if="overlay.type === 'arrow'"
                :x="overlay.x"
                :y="overlay.y"
                :scale="overlay.scale"
                :rotation="overlay.rotation"
                :arrow-direction="overlay.arrowDirection"
                :selected="false"
              />
              <MarkerOverlay
                v-else
                :x="overlay.x"
                :y="overlay.y"
                :label="overlay.label"
                :selected="false"
              />
            </template>
          </div>
        </div>
        
        <!-- Placeholder if no image -->
        <div v-else class="image-placeholder">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
            <path d="M21 15L16 10L5 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>{{ t('noImage') }}</span>
        </div>

        <!-- Step Type Badge -->
        <div class="step-type-badge">
          <span class="badge-dot"></span>
          <span class="badge-text">{{ stepTypeLabel }}</span>
        </div>

        <!-- Annotation Count -->
        <div v-if="overlayCount > 0" class="annotation-count">
          <span class="annotation-dot"></span>
          <span class="annotation-text">
            {{ overlayCount }} {{ t('annotationOnPhoto') }}
          </span>
        </div>

        <!-- Step Progress Bar -->
        <div class="step-progress">
          <div class="step-counter-pill">
            <span>{{ `${t('step')} ${currentIndex + 1} ${t('of')} ${totalSteps}` }}</span>
          </div>
          <div class="step-dots">
            <span
              v-for="i in totalSteps"
              :key="i"
              class="step-dot"
              :class="{ 'step-dot--active': i - 1 === currentIndex, 'step-dot--completed': i - 1 < currentIndex }"
            ></span>
          </div>
        </div>
      </div>

      <!-- Step Info -->
      <div class="step-info">
        <h2 class="step-title">{{ stepTitle }}</h2>
        <p class="step-instruction">{{ stepInstruction }}</p>
        
        <div class="step-divider"></div>
        
        <button class="cant-find-button" @click="handleCantFind">
          <span class="cant-find-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
              <path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </span>
          <span class="cant-find-text">{{ t('cantFindStep') }}</span>
        </button>
      </div>
    </main>

    <!-- Footer Navigation -->
    <footer class="playback-footer">
      <button
        class="nav-button nav-button--back"
        :disabled="isFirstStep"
        @click="handlePrevious"
        :aria-label="t('previous')"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      
      <button class="nav-button nav-button--next" @click="handleNext">
        <span>{{ isLastStep ? t('youveArrived') : t('next') }}</span>
        <template v-if="isLastStep">
          <span class="arrived-emoji">🏁</span>
        </template>
        <template v-else>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </template>
      </button>
    </footer>

    <!-- Feedback Modal -->
    <FeedbackModal
      :open="showFeedbackModal"
      :guidance-set-id="guidanceSet?.id || ''"
      :step-id="currentStep?.id || ''"
      @close="handleFeedbackClose"
    />
  </div>
</template>

<style scoped>
.playback-page {
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-background);
  overflow: hidden;
}

/* Header */
.playback-header {
  display: flex;
  align-items: center;
  padding: calc(env(safe-area-inset-top, 0px) + var(--spacing-sm)) var(--spacing-md) var(--spacing-sm);
  background-color: white;
  border-bottom: 1px solid var(--color-border);
  gap: var(--spacing-sm);
  position: sticky;
  top: 0;
  z-index: 20;
}

.header-back {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  border: none;
  background-color: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}

.header-title {
  flex: 1;
  font-size: var(--font-size-base);
  font-weight: 500;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  flex-shrink: 0;
}

.header-home {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background-color: white;
  color: var(--color-text);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: background-color 0.15s ease;
}

.header-home:hover {
  background-color: var(--color-background);
}

.header-language-picker {
  position: relative;
}

.header-language {
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background-color: white;
  font-size: var(--font-size-sm);
  color: var(--color-text);
  cursor: pointer;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.language-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  min-width: 130px;
  background: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
  z-index: 100;
  overflow: hidden;
}

[dir="rtl"] .language-dropdown {
  right: auto;
  left: 0;
}

.language-dropdown-item {
  display: block;
  width: 100%;
  padding: 8px 14px;
  border: none;
  background: none;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
  cursor: pointer;
  text-align: start;
}

.language-dropdown-item:hover {
  background-color: var(--color-primary-light);
}

.language-dropdown-item.active {
  color: var(--color-primary);
  font-weight: 700;
  background-color: var(--color-primary-light);
}

/* Availability Banner */
.availability-banner {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: #f0fdf4;
  position: sticky;
  top: 0;
  z-index: 19;
}

.availability-icon {
  color: #16a34a;
  flex-shrink: 0;
}

.availability-text {
  font-size: var(--font-size-sm);
  color: #16a34a;
}

/* Main Content */
.playback-content {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Image Container */
.image-container {
  position: relative;
  background-color: #1f2937;
  flex: 1;
  min-height: 0;
}

.step-image-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.step-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.step-image--loaded {
  opacity: 1;
}

.overlays-container {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  color: #6b7280;
}

/* Step Type Badge */
.step-type-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: var(--radius-full);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

[dir="rtl"] .step-type-badge {
  left: auto;
  right: 12px;
}

.badge-dot {
  width: 6px;
  height: 6px;
  background-color: var(--color-primary);
  border-radius: 50%;
}

.badge-text {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
}

/* Annotation Count */
.annotation-count {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background-color: rgba(0, 0, 0, 0.6);
  border-radius: var(--radius-full);
}

[dir="rtl"] .annotation-count {
  right: auto;
  left: 12px;
}

.annotation-dot {
  width: 6px;
  height: 6px;
  background-color: var(--color-primary);
  border-radius: 50%;
}

.annotation-text {
  font-size: 12px;
  color: white;
}

/* Step Progress */
.step-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm) var(--spacing-md);
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.5));
}

.step-counter-pill {
  padding: 6px 14px;
  background-color: rgba(0, 0, 0, 0.6);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  color: white;
  font-weight: 500;
}

.step-dots {
  display: flex;
  gap: 8px;
}

.step-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.4);
  transition: all 0.2s ease;
}

.step-dot--active {
  width: 16px;
  border-radius: 4px;
  background-color: white;
}

.step-dot--completed {
  background-color: rgba(255, 255, 255, 0.7);
}

/* Step Info */
.step-info {
  padding: var(--spacing-md) var(--spacing-md);
  background-color: white;
  flex-shrink: 0;
}

.step-title {
  font-size: 1.375rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 var(--spacing-sm) 0;
  line-height: 1.3;
}

.step-instruction {
  font-size: var(--font-size-base);
  color: var(--color-text-muted);
  margin: 0;
  line-height: 1.5;
}

.step-divider {
  height: 1px;
  background-color: var(--color-border);
  margin: var(--spacing-sm) 0;
}

.cant-find-button {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-background);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  width: 100%;
}

.cant-find-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background-color: white;
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.cant-find-text {
  font-size: var(--font-size-base);
  color: var(--color-text);
}

/* Footer Navigation */
.playback-footer {
  display: flex;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md) calc(env(safe-area-inset-bottom, 0px) + var(--spacing-sm));
  background-color: white;
  border-top: 1px solid var(--color-border);
  flex-shrink: 0;
}

.nav-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  border: none;
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  height: 48px;
}

.nav-button--back {
  width: 56px;
  background-color: var(--color-background);
  color: var(--color-text);
  flex-shrink: 0;
}

.nav-button--back:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.nav-button--next {
  flex: 1;
  background-color: var(--color-primary);
  color: white;
}

.nav-button--next:hover {
  background-color: var(--color-primary-dark);
}

.arrived-emoji {
  font-size: 1.125rem;
}

/* RTL Adjustments */
[dir="rtl"] .nav-button--back svg,
[dir="rtl"] .nav-button--next svg,
[dir="rtl"] .header-back svg {
  transform: scaleX(-1);
}
</style>
