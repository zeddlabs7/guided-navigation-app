<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import type { StepType } from '@guidenav/types';

const router = useRouter();

const title = ref('');
const titleArabic = ref('');
const loading = ref(false);
const showStepTypeSelector = ref(false);

interface StepTypeOption {
  type: StepType;
  label: string;
}

const stepTypeOptions: StepTypeOption[] = [
  { type: 'APPROACH', label: 'Parking' },
  { type: 'GATE_ENTRY', label: 'Gate Entry' },
  { type: 'PIN_CHECK', label: 'PIN Check' },
  { type: 'ELEVATOR', label: 'Elevator' },
  { type: 'DOOR_ENTRY', label: 'Door Entry' },
];

const stepCount = ref(0);
const displayTitle = computed(() => title.value || 'Untitled Address');

function handleBack() {
  router.push('/dashboard');
}

function handleSaveDraft() {
  loading.value = true;
  setTimeout(() => {
    loading.value = false;
    router.push('/dashboard');
  }, 500);
}

function handlePreviewAndPublish() {
  console.log('Preview & Publish');
}

function handleAddStep() {
  showStepTypeSelector.value = true;
}

function handleCloseStepSelector() {
  showStepTypeSelector.value = false;
}

function handleSelectStepType(stepType: StepType) {
  showStepTypeSelector.value = false;
  router.push(`/guidance/new/steps?type=${stepType}`);
}
</script>

<template>
  <div class="create-page">
    <header class="create-header">
      <button class="create-header__back" @click="handleBack" aria-label="Go back">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      
      <div class="create-header__info">
        <span class="create-header__label">New Address</span>
        <span class="create-header__title">{{ displayTitle }}</span>
      </div>
      
      <button class="create-header__save-btn" @click="handleSaveDraft">
        Save Draft
      </button>
    </header>
    
    <main class="create-content">
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
        
        <div v-if="!showStepTypeSelector" class="steps-empty">
          <div class="steps-empty__icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
              <path d="M12 8V16M8 12H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <p class="steps-empty__text">No steps added yet. Tap "Add Step" to begin.</p>
        </div>
        
        <div v-else class="step-type-selector">
          <div class="step-type-selector__header">
            <p class="step-type-selector__prompt">Choose a step type to continue</p>
            <button class="step-type-selector__close" @click="handleCloseStepSelector" aria-label="Close">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
          
          <div class="step-type-options">
            <button 
              v-for="option in stepTypeOptions"
              :key="option.type"
              class="step-type-option"
              @click="handleSelectStepType(option.type)"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
        
        <button class="add-step-btn" @click="handleAddStep">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Add Step
        </button>
      </div>
    </main>
    
    <footer class="create-footer">
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
.create-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--color-background);
}

.create-header {
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

.create-header__back {
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

.create-header__back:hover {
  background-color: var(--color-background);
  color: var(--color-text);
}

.create-header__info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.create-header__label {
  font-size: 10px;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.create-header__title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.create-header__save-btn {
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

.create-header__save-btn:hover {
  background-color: var(--color-background);
  border-color: var(--color-secondary-dark);
}

.create-content {
  flex: 1;
  padding: 20px 16px;
  padding-bottom: 100px;
  max-width: 100%;
}

@media (min-width: 640px) {
  .create-content {
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

.step-type-selector {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  padding: 18px;
}

.step-type-selector__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.step-type-selector__prompt {
  margin: 0;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
}

.step-type-selector__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: none;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.step-type-selector__close:hover {
  background-color: var(--color-background);
  color: var(--color-text);
}

.step-type-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.step-type-option {
  padding: 8px 13px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.step-type-option:hover {
  background-color: var(--color-primary-bg);
  border-color: var(--color-primary);
  color: var(--color-primary);
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

.create-footer {
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
  .create-footer {
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
