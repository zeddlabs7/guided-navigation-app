<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { StepCard } from '@guidenav/ui';
import type { GuidanceStatus, StepType } from '@guidenav/types';

const router = useRouter();
const route = useRoute();
const guidanceSetId = route.params.guidanceSetId as string;

const title = ref('Al Nakheel Tower – Delivery Guide');
const titleArabic = ref('برج النخيل – دليل التوصيل');
const status = ref<GuidanceStatus>('PUBLISHED');
const loading = ref(false);

interface StepData {
  id: string;
  stepType: StepType;
  title: string;
  instructions: string;
  imageUrl: string | null;
  overlayCount: number;
}

const steps = ref<StepData[]>([
  {
    id: 's1',
    stepType: 'APPROACH',
    title: 'Enter Basement Parking',
    instructions: 'Use the ramp on the right side of the building. Barrier opens automatically for delivery vehicles.',
    imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=200',
    overlayCount: 1,
  },
  {
    id: 's2',
    stepType: 'PIN_CHECK',
    title: 'Enter PIN at Gate Panel',
    instructions: 'PIN: 1234#. The keypad is mounted on the left pillar at chest height.',
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200',
    overlayCount: 1,
  },
  {
    id: 's3',
    stepType: 'ELEVATOR',
    title: 'Take Elevator to Floor 8',
    instructions: 'Elevator is straight ahead after entering the lobby. Press 8.',
    imageUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=200',
    overlayCount: 0,
  },
  {
    id: 's4',
    stepType: 'DOOR_ENTRY',
    title: 'Apartment 804 – Knock Twice',
    instructions: 'Turn left after exiting the elevator. Apartment 804 is third door on the right.',
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200',
    overlayCount: 0,
  },
]);

const stepCount = computed(() => steps.value.length);

const statusConfig: Record<GuidanceStatus, { bg: string; dot: string; text: string; label: string }> = {
  PUBLISHED: { bg: '#f0fdf4', dot: '#00c950', text: '#008236', label: 'Published' },
  DRAFT: { bg: '#fffbeb', dot: '#ffb900', text: '#bb4d00', label: 'Draft' },
  DISABLED: { bg: '#f3f4f6', dot: '#99a1af', text: '#6a7282', label: 'Disabled' },
};

function handleBack() {
  router.push('/dashboard');
}

function handleSaveDraft() {
  loading.value = true;
  setTimeout(() => {
    loading.value = false;
  }, 500);
}

function handlePreviewAndPublish() {
  router.push(`/guidance/${guidanceSetId}/preview`);
}

function handleAddStep() {
  router.push(`/guidance/${guidanceSetId}/steps`);
}

function handleMoveUp(index: number) {
  if (index > 0) {
    const temp = steps.value[index];
    steps.value[index] = steps.value[index - 1];
    steps.value[index - 1] = temp;
  }
}

function handleMoveDown(index: number) {
  if (index < steps.value.length - 1) {
    const temp = steps.value[index];
    steps.value[index] = steps.value[index + 1];
    steps.value[index + 1] = temp;
  }
}

function handleEditStep(stepId: string) {
  router.push(`/guidance/${guidanceSetId}/steps?edit=${stepId}`);
}

function handleDeleteStep(index: number) {
  steps.value.splice(index, 1);
}
</script>

<template>
  <div class="edit-page">
    <header class="edit-header">
      <button class="edit-header__back" @click="handleBack" aria-label="Go back">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      
      <div class="edit-header__info">
        <span class="edit-header__label">Edit Guidance</span>
        <span class="edit-header__title">{{ title || 'Untitled Guidance' }}</span>
      </div>
      
      <span 
        class="edit-header__status"
        :style="{
          backgroundColor: statusConfig[status].bg,
          color: statusConfig[status].text,
        }"
      >
        <span 
          class="edit-header__status-dot"
          :style="{ backgroundColor: statusConfig[status].dot }"
        />
        {{ statusConfig[status].label }}
      </span>
      
      <button class="edit-header__save-btn" @click="handleSaveDraft">
        Save Draft
      </button>
    </header>
    
    <main class="edit-content">
      <div class="warning-banner">
        <svg class="warning-banner__icon" width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 9V13M12 17H12.01M10.29 3.86L1.82 18C1.64 18.3 1.55 18.64 1.55 19C1.55 19.36 1.64 19.7 1.82 20C2 20.3 2.26 20.56 2.58 20.74C2.9 20.92 3.26 21.01 3.64 21H20.36C20.74 21.01 21.1 20.92 21.42 20.74C21.74 20.56 22 20.3 22.18 20C22.36 19.7 22.45 19.36 22.45 19C22.45 18.64 22.36 18.3 22.18 18L13.71 3.86C13.53 3.56 13.27 3.32 12.95 3.16C12.63 3 12.28 2.92 11.91 2.93C11.54 2.94 11.19 3.04 10.89 3.21C10.59 3.38 10.34 3.63 10.17 3.93L10.29 3.86Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <p class="warning-banner__text">
          Avoid uploading faces, license plates, or private documents.
        </p>
      </div>
      
      <div class="form-section">
        <div class="form-field">
          <label class="form-label">Guidance Title</label>
          <input 
            v-model="title"
            type="text"
            class="form-input"
            placeholder="e.g. Al Nakheel Tower – Delivery Guide"
          />
        </div>
        
        <div class="form-field">
          <label class="form-label form-label--optional">Arabic Title (optional)</label>
          <input 
            v-model="titleArabic"
            type="text"
            class="form-input"
            dir="rtl"
            placeholder="عنوان عربي اختياري"
          />
        </div>
      </div>
      
      <div class="divider" />
      
      <div class="steps-section">
        <div class="steps-header">
          <h2 class="steps-title">Steps</h2>
          <span class="steps-count">{{ stepCount }}</span>
        </div>
        
        <div v-if="steps.length === 0" class="steps-empty">
          <div class="steps-empty__icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
              <path d="M12 8V16M8 12H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <p class="steps-empty__text">No steps added yet. Tap "Add Step" to begin.</p>
        </div>
        
        <div v-else class="steps-list">
          <StepCard
            v-for="(step, index) in steps"
            :key="step.id"
            :step-number="index + 1"
            :step-type="step.stepType"
            :title="step.title"
            :instructions="step.instructions"
            :image-url="step.imageUrl"
            :overlay-count="step.overlayCount"
            :is-first="index === 0"
            :is-last="index === steps.length - 1"
            @move-up="handleMoveUp(index)"
            @move-down="handleMoveDown(index)"
            @edit="handleEditStep(step.id)"
            @delete="handleDeleteStep(index)"
          />
        </div>
        
        <button class="add-step-btn" @click="handleAddStep">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Add Step
        </button>
      </div>
    </main>
    
    <footer class="edit-footer">
      <button class="footer-btn footer-btn--secondary" @click="handleSaveDraft">
        Save Draft
      </button>
      <button class="footer-btn footer-btn--primary" @click="handlePreviewAndPublish">
        Preview & Publish
      </button>
    </footer>
  </div>
</template>

<style scoped>
.edit-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--color-background);
}

.edit-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background-color: var(--color-surface);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: var(--shadow-md);
  position: sticky;
  top: 0;
  z-index: 100;
}

.edit-header__back {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: none;
  border: none;
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.edit-header__back:hover {
  background-color: var(--color-background);
  color: var(--color-text);
}

.edit-header__info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.edit-header__label {
  font-size: 10px;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.edit-header__title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}

.edit-header__status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  line-height: 1.5;
  white-space: nowrap;
}

.edit-header__status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.edit-header__save-btn {
  margin-left: auto;
  padding: 8px 16px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.edit-header__save-btn:hover {
  background-color: var(--color-background);
  border-color: var(--color-secondary-dark);
}

.edit-content {
  flex: 1;
  padding: 20px 16px;
  padding-bottom: 100px;
  max-width: 100%;
}

@media (min-width: 640px) {
  .edit-content {
    max-width: 400px;
    margin: 0 auto;
  }
}

.warning-banner {
  display: flex;
  gap: 12px;
  padding: 13px 17px;
  background-color: var(--color-warning-bg);
  border: 1px solid #fef3c6;
  border-radius: var(--radius-lg);
  margin-bottom: 20px;
}

.warning-banner__icon {
  flex-shrink: 0;
  color: var(--color-warning);
}

.warning-banner__text {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-warning);
  line-height: 1.6;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.form-label--optional {
  color: var(--color-text-muted);
}

.form-input {
  padding: 14px 16px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
  color: var(--color-text);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.form-input::placeholder {
  color: var(--color-text-light);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.divider {
  height: 1px;
  background-color: var(--color-border-light);
  margin: 20px 0;
}

.steps-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.steps-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.steps-title {
  margin: 0;
  font-size: 20px;
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
}

.steps-count {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
  height: 24px;
  background-color: var(--color-primary-bg);
  color: var(--color-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  border-radius: var(--radius-full);
}

.steps-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 32px;
  text-align: center;
}

.steps-empty__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background-color: var(--color-background);
  border-radius: var(--radius-lg);
  color: var(--color-text-muted);
  margin-bottom: 16px;
}

.steps-empty__text {
  margin: 0;
  font-size: var(--font-size-base);
  color: var(--color-text-muted);
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.add-step-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 14px;
  background-color: var(--color-surface);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-step-btn:hover {
  background-color: var(--color-background);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.edit-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  background-color: var(--color-surface);
  border-top: 1px solid var(--color-border-light);
}

@media (min-width: 640px) {
  .edit-footer {
    max-width: 400px;
    left: 50%;
    transform: translateX(-50%);
  }
}

.footer-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all 0.2s ease;
}

.footer-btn--secondary {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
}

.footer-btn--secondary:hover {
  background-color: var(--color-background);
  border-color: var(--color-secondary-dark);
}

.footer-btn--primary {
  background-color: var(--color-primary);
  border: none;
  color: white;
}

.footer-btn--primary:hover {
  background-color: var(--color-primary-dark);
}
</style>
