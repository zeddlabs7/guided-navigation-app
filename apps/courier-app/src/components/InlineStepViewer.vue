<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import ArrowOverlay from '@guidenav/ui/components/ArrowOverlay.vue';
import MarkerOverlay from '@guidenav/ui/components/MarkerOverlay.vue';
import type { GuidanceStep } from '@guidenav/types';
import { useCourierSession } from '@/composables/useCourierSession';
import { useTranslation } from '@/composables/useTranslation';
import { logAnalyticsEvent } from '@/utils/lazyFirebase';
import { openWhatsApp } from '@/utils/contact';

const { t } = useTranslation();
const {
  getStepInstruction,
  getStepTitle,
  guidanceSet,
  isRtl,
  getRecipientPhoneNumber,
  saveLastStep,
  getLastStep,
} = useCourierSession();

interface Props {
  steps: GuidanceStep[];
  isRtl: boolean;
  onViewAllSteps: () => void;
}

const props = defineProps<Props>();

const currentIndex = ref(getLastStep());
const showComplete = ref(false);
const deliveryConfirmed = ref(false);
const isConfirming = ref(false);

// Per-step loaded tracking — once true, never reset
const loadedSteps: Record<number, boolean> = reactive({});

function onStepImageLoad(index: number) {
  loadedSteps[index] = true;
}

const currentStep = computed(() => props.steps[currentIndex.value] ?? null);
const isFirstStep = computed(() => currentIndex.value === 0);
const isLastStep = computed(() => currentIndex.value === props.steps.length - 1);
const totalSteps = computed(() => props.steps.length);

const progressText = computed(() => {
  return t('stepOf')
    .replace('{current}', String(currentIndex.value + 1))
    .replace('{total}', String(totalSteps.value));
});

function getInstruction(step: GuidanceStep, index: number): string {
  return getStepInstruction(step, index) || t('noInstructions');
}

function handlePrevious() {
  if (showComplete.value) {
    showComplete.value = false;
    return;
  }
  if (!isFirstStep.value) {
    currentIndex.value--;
    saveLastStep(currentIndex.value);
  }
}

function handleNext() {
  if (isLastStep.value) {
    showComplete.value = true;
  } else {
    currentIndex.value++;
    saveLastStep(currentIndex.value);
  }
}

function handleConfirmDelivery() {
  if (isConfirming.value || deliveryConfirmed.value) return;
  isConfirming.value = true;

  const phoneNumber = getRecipientPhoneNumber();
  if (phoneNumber) {
    const message = isRtl.value
      ? 'مرحبًا، لقد وصلت إلى نقطة التسليم وتم تأكيد التوصيل. يرجى الاطلاع على الصورة المرفقة.'
      : 'Hello, I have arrived at the drop-off point and confirmed the delivery. Please see photo attached.';
    openWhatsApp(phoneNumber, message);
  }

  if (guidanceSet.value) {
    logAnalyticsEvent({
      app: 'COURIER',
      eventType: 'DELIVERY_CONFIRMED',
      guidanceSetId: guidanceSet.value.id,
      metadata: { timestamp: new Date().toISOString() },
    }).catch(() => {});
  }

  deliveryConfirmed.value = true;
  isConfirming.value = false;
}

function handleContactRecipient() {
  const phoneNumber = getRecipientPhoneNumber();
  if (phoneNumber) {
    openWhatsApp(phoneNumber);
  }
}
</script>

<template>
  <div v-if="steps.length > 0" class="inline-step-viewer">
    <!-- ===== Step viewer section (hidden when complete is shown) ===== -->
    <div v-show="!showComplete" class="step-view">
      <!-- Step progress header -->
      <div class="step-header">
        <span class="step-progress-text">{{ progressText }}</span>
        <button class="view-all-btn" type="button" @click="props.onViewAllSteps">
          {{ t('viewAllSteps') }}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>

      <!-- Step dots -->
      <div class="step-dots">
        <span
          v-for="i in totalSteps"
          :key="i"
          class="step-dot"
          :class="{
            'step-dot--active': i - 1 === currentIndex,
            'step-dot--completed': i - 1 < currentIndex,
          }"
        />
      </div>

      <!-- Pre-rendered image carousel: all steps in DOM, only active one visible -->
      <div class="step-image-container">
        <div
          v-for="(step, i) in steps"
          :key="step.id"
          v-show="i === currentIndex"
          class="step-image-slot"
        >
          <template v-if="step.image?.publicUrl">
            <div v-show="!loadedSteps[i]" class="step-image-loading">
              <span class="spinner" />
            </div>
            <img
              :src="step.image.publicUrl"
              :alt="getStepTitle(step, i)"
              class="step-image"
              :class="{ 'step-image--loading': !loadedSteps[i] }"
              @load="onStepImageLoad(i)"
            />
            <div v-show="loadedSteps[i]" class="overlays-container">
              <template v-for="overlay in step.overlays" :key="overlay.id">
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
            <div v-show="(step.overlays?.length ?? 0) > 0 && loadedSteps[i]" class="annotation-badge">
              <span class="annotation-dot" />
              <span>{{ step.overlays?.length ?? 0 }} {{ t('annotationOnPhoto') }}</span>
            </div>
          </template>
          <div v-else class="step-image-placeholder">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.8"/>
              <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
              <path d="M21 15l-5-5L5 21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>{{ t('noImage') }}</span>
          </div>
        </div>
      </div>

      <!-- Step instruction -->
      <div class="step-content">
        <p v-if="currentStep" class="step-instruction">{{ getInstruction(currentStep, currentIndex) }}</p>
      </div>

      <!-- Previous / Next controls -->
      <div class="step-nav">
        <button
          class="step-nav-btn step-nav-btn--prev"
          :disabled="isFirstStep"
          type="button"
          @click="handlePrevious"
          :aria-label="t('previous')"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>{{ t('previous') }}</span>
        </button>
        <button
          class="step-nav-btn step-nav-btn--next"
          type="button"
          @click="handleNext"
          :aria-label="isLastStep ? t('youveArrived') : t('next')"
        >
          <span>{{ isLastStep ? t('youveArrived') : t('next') }}</span>
          <span v-if="isLastStep" class="arrived-emoji">🏁</span>
          <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- ===== Completion section (hidden when steps are shown) ===== -->
    <div v-show="showComplete" class="complete-view">
      <div class="complete-section">
        <div class="complete-icon" :class="{ 'complete-icon--confirmed': deliveryConfirmed }">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M22 4L12 14.01l-3-3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h3 class="complete-title">
          {{ deliveryConfirmed ? t('deliveryConfirmed') : t('reachedDropOff') }}
        </h3>
        <p class="complete-message">
          {{ deliveryConfirmed ? t('thankYou') : t('confirmBelow') }}
        </p>

        <div class="complete-actions">
          <button
            v-if="!deliveryConfirmed"
            class="complete-btn complete-btn--confirm"
            :disabled="isConfirming"
            type="button"
            @click="handleConfirmDelivery"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M22 4L12 14.01l-3-3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>{{ isConfirming ? t('confirming') : t('confirmDelivery') }}</span>
          </button>

          <p v-if="!deliveryConfirmed" class="whatsapp-hint">
            <svg class="whatsapp-hint-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>{{ t('whatsappHint') }}</span>
          </p>

          <button class="complete-btn complete-btn--contact" type="button" @click="handleContactRecipient">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>{{ t('contactRecipient') }}</span>
          </button>
        </div>
      </div>

      <div class="step-nav">
        <button
          class="step-nav-btn step-nav-btn--prev"
          type="button"
          @click="handlePrevious"
          :aria-label="t('previous')"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>{{ t('previous') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.inline-step-viewer {
  padding-top: clamp(10px, 1.8dvh, 14px);
}

.step-view,
.complete-view {
  display: flex;
  flex-direction: column;
  gap: clamp(10px, 1.8dvh, 14px);
}

/* Header with progress + view all */
.step-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.step-progress-text {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text);
}

.view-all-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  border: none;
  background: none;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-primary);
  cursor: pointer;
  font-family: inherit;
}

/* Step dots */
.step-dots {
  display: flex;
  gap: 6px;
  justify-content: center;
}

.step-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--color-border);
  transition: all 0.2s ease;
}

.step-dot--active {
  width: 20px;
  border-radius: 4px;
  background-color: var(--color-primary);
}

.step-dot--completed {
  background-color: var(--color-primary);
  opacity: 0.5;
}

/* Step image carousel */
.step-image-container {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background-color: #1f2937;
}

.step-image-slot {
  position: absolute;
  inset: 0;
}

.step-image-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255, 255, 255, 0.2);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.step-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.step-image--loading {
  visibility: hidden;
}

.overlays-container {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.step-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--color-text-muted);
  font-size: 13px;
}

.annotation-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  background-color: rgba(0, 0, 0, 0.6);
  border-radius: var(--radius-full);
  font-size: 11px;
  color: white;
}

[dir="rtl"] .annotation-badge {
  right: auto;
  left: 8px;
}

.annotation-dot {
  width: 6px;
  height: 6px;
  background-color: var(--color-primary);
  border-radius: 50%;
}

/* Step instruction */
.step-content {
  padding: 0 2px;
}

.step-instruction {
  margin: 0;
  font-size: clamp(17px, 3.2dvh, 20px);
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.4;
}

/* Navigation controls */
.step-nav {
  display: flex;
  gap: 8px;
}

.step-nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 44px;
  border: none;
  border-radius: var(--radius-lg);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
}

.step-nav-btn--prev {
  flex: 0 0 auto;
  padding: 0 16px;
  background-color: var(--color-background);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.step-nav-btn--prev:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.step-nav-btn--next {
  flex: 1;
  background-color: var(--color-primary);
  color: white;
}

.arrived-emoji {
  font-size: 1.125rem;
}

/* RTL */
[dir="rtl"] .step-nav-btn svg {
  transform: scaleX(-1);
}

/* ---- Inline completion section ---- */
.complete-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;
  padding: clamp(12px, 2dvh, 20px) 0;
}

.complete-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: #dcfce7;
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.complete-icon--confirmed {
  background-color: var(--color-primary);
  color: white;
}

.complete-title {
  font-size: clamp(17px, 3dvh, 20px);
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
  line-height: 1.3;
}

.complete-message {
  font-size: 14px;
  color: var(--color-text-muted);
  margin: 0;
  max-width: 280px;
}

.complete-actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
}

.complete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 44px;
  border: none;
  border-radius: var(--radius-lg);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s ease;
}

.complete-btn--confirm {
  background-color: var(--color-primary);
  color: white;
}

.complete-btn--confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.complete-btn--contact {
  background-color: white;
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.whatsapp-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin: 0;
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.4;
}

.whatsapp-hint-icon {
  flex-shrink: 0;
  color: #25D366;
}
</style>
