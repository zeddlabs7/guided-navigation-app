<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { submitFeedback } from '@guidenav/services';
import type { FeedbackReasonCode } from '@guidenav/types';
import { useCourierSession } from '@/composables/useCourierSession';

interface Props {
  open: boolean;
  guidanceSetId: string;
  stepId: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
}>();

const { shareLink, currentLanguage } = useCourierSession();

const isRtl = computed(() => currentLanguage.value === 'ar');

const selectedReason = ref<FeedbackReasonCode | null>(null);
const isSubmitting = ref(false);

const feedbackOptions: Array<{ code: FeedbackReasonCode; labelEn: string; labelAr: string }> = [
  { code: 'WRONG_PHOTO', labelEn: 'Photo unclear', labelAr: 'الصورة غير واضحة' },
  { code: 'UNCLEAR_DIRECTION', labelEn: 'No visible landmark', labelAr: 'لا يوجد معلم مرئي' },
  { code: 'MISSING_STEP', labelEn: 'Gate closed', labelAr: 'البوابة مغلقة' },
  { code: 'LOCATION_CONFUSING', labelEn: 'Incorrect PIN', labelAr: 'رقم PIN غير صحيح' },
  { code: 'OTHER', labelEn: 'Other', labelAr: 'أخرى' },
];

watch(() => props.open, (isOpen) => {
  if (!isOpen) {
    selectedReason.value = null;
    isSubmitting.value = false;
  }
});

function handleClose() {
  emit('close');
}

function handleSelectReason(code: FeedbackReasonCode) {
  selectedReason.value = code;
}

async function handleSubmit() {
  if (!selectedReason.value || isSubmitting.value) return;

  isSubmitting.value = true;

  try {
    await submitFeedback({
      guidanceSetId: props.guidanceSetId,
      guidanceStepId: props.stepId,
      shareLinkId: shareLink.value?.id,
      eventType: 'CANT_FIND_STEP',
      reasonCode: selectedReason.value,
    });

    emit('close');
  } catch (error) {
    console.error('Failed to submit feedback:', error);
  } finally {
    isSubmitting.value = false;
  }
}

function handleBackdropClick(event: MouseEvent) {
  if (event.target === event.currentTarget) {
    handleClose();
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="modal-backdrop" :dir="isRtl ? 'rtl' : 'ltr'" @click="handleBackdropClick">
        <div class="modal-sheet">
          <!-- Drag Handle -->
          <div class="sheet-handle">
            <div class="handle-bar"></div>
          </div>

          <!-- Header -->
          <div class="sheet-header">
            <div class="header-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                <path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
            <h2 class="header-title">{{ isRtl ? 'لا أجد هذه الخطوة' : "I can't find this step" }}</h2>
            <button class="header-close" @click="handleClose" :aria-label="isRtl ? 'إغلاق' : 'Close'">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>

          <!-- Content -->
          <div class="sheet-content">
            <p class="content-question">{{ isRtl ? 'ما هي المشكلة؟' : 'What seems to be the issue?' }}</p>

            <div class="options-list">
              <button
                v-for="option in feedbackOptions"
                :key="option.code"
                class="option-button"
                :class="{ 'option-button--selected': selectedReason === option.code }"
                @click="handleSelectReason(option.code)"
              >
                <span class="option-radio">
                  <span v-if="selectedReason === option.code" class="option-radio-dot"></span>
                </span>
                <span class="option-label">{{ isRtl ? option.labelAr : option.labelEn }}</span>
              </button>
            </div>

            <button
              class="submit-button"
              :disabled="!selectedReason || isSubmitting"
              @click="handleSubmit"
            >
              {{ isSubmitting ? (isRtl ? 'جاري الإرسال...' : 'Submitting...') : (isRtl ? 'إرسال التقرير' : 'Submit Report') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
}

.modal-sheet {
  background-color: white;
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  width: 100%;
  max-width: 500px;
  max-height: 85vh;
  overflow-y: auto;
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.sheet-handle {
  display: flex;
  justify-content: center;
  padding: var(--spacing-sm) 0;
}

.handle-bar {
  width: 32px;
  height: 4px;
  background-color: var(--color-border);
  border-radius: 2px;
}

.sheet-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-lg);
}

.header-icon {
  width: 18px;
  height: 18px;
  color: var(--color-warning);
  flex-shrink: 0;
}

.header-title {
  flex: 1;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.header-close {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  border: none;
  background-color: var(--color-background);
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}

.header-close:hover {
  background-color: var(--color-border);
}

.sheet-content {
  padding: 0 var(--spacing-lg) var(--spacing-xl);
}

.content-question {
  font-size: var(--font-size-base);
  color: var(--color-text);
  margin: 0 0 var(--spacing-md) 0;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
}

.option-button {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background-color: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  text-align: start;
  transition: all 0.15s ease;
}

.option-button:hover {
  border-color: var(--color-primary-light);
}

.option-button--selected {
  border-color: var(--color-primary);
  background-color: var(--color-primary-light);
}

.option-radio {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: border-color 0.15s ease;
}

.option-button--selected .option-radio {
  border-color: var(--color-primary);
}

.option-radio-dot {
  width: 8px;
  height: 8px;
  background-color: var(--color-primary);
  border-radius: 50%;
}

.option-label {
  font-size: var(--font-size-base);
  color: var(--color-text);
}

.submit-button {
  width: 100%;
  padding: var(--spacing-md);
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.submit-button:hover:not(:disabled) {
  background-color: var(--color-primary-dark);
}

.submit-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-active .modal-sheet,
.modal-leave-active .modal-sheet {
  transition: transform 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  background-color: rgba(0, 0, 0, 0);
}

.modal-enter-from .modal-sheet,
.modal-leave-to .modal-sheet {
  transform: translateY(100%);
}
</style>
