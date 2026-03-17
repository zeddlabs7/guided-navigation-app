<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import type { StepType, Overlay } from '@guidenav/types';
import { OverlayEditor } from '@guidenav/ui';

const router = useRouter();
const route = useRoute();
const guidanceSetId = route.params.guidanceSetId as string;

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

const selectedStepType = ref<StepType>((route.query.type as StepType) || 'DOOR_ENTRY');
const stepTitle = ref('');
const stepTitleArabic = ref('');
const instructions = ref('');
const instructionsArabic = ref('');
const imageUrl = ref<string | null>(null);
const overlays = ref<Overlay[]>([]);
const loading = ref(false);

const selectedTypeLabel = computed(() => {
  const option = stepTypeOptions.find(o => o.type === selectedStepType.value);
  return option?.label || selectedStepType.value;
});

const stepTypeBadgeStyle = computed(() => {
  const colors: Record<StepType, { bg: string; dot: string; text: string }> = {
    PIN_CHECK: { bg: '#fffbeb', dot: '#ffb900', text: '#bb4d00' },
    APPROACH: { bg: '#f3f4f6', dot: '#99a1af', text: '#4a5565' },
    GATE_ENTRY: { bg: '#f0fdf4', dot: '#00c950', text: '#008236' },
    WALK_PATH: { bg: '#f3f4f6', dot: '#99a1af', text: '#4a5565' },
    TURN: { bg: '#f3f4f6', dot: '#99a1af', text: '#4a5565' },
    STAIRS: { bg: '#f3f4f6', dot: '#99a1af', text: '#4a5565' },
    ELEVATOR: { bg: '#faf5ff', dot: '#ad46ff', text: '#8200db' },
    LANDMARK: { bg: '#f3f4f6', dot: '#99a1af', text: '#4a5565' },
    DOOR_ENTRY: { bg: '#eff6ff', dot: '#2b7fff', text: '#1447e6' },
    RECEPTION: { bg: '#f3f4f6', dot: '#99a1af', text: '#4a5565' },
    DROPOFF_POINT: { bg: '#f0fdf4', dot: '#00c950', text: '#008236' },
  };
  return colors[selectedStepType.value] || colors.APPROACH;
});

function handleBack() {
  router.push(`/guidance/${guidanceSetId}/edit`);
}

function handleSaveStep() {
  loading.value = true;
  console.log('Saving step with overlays:', overlays.value);
  setTimeout(() => {
    loading.value = false;
    router.push(`/guidance/${guidanceSetId}/edit`);
  }, 500);
}

function handleSelectStepType(type: StepType) {
  selectedStepType.value = type;
}

function handleUploadPhoto() {
  imageUrl.value = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600';
}

function handleRemovePhoto() {
  imageUrl.value = null;
  overlays.value = [];
}

function handleOverlaysUpdate(newOverlays: Overlay[]) {
  overlays.value = newOverlays;
}
</script>

<template>
  <div class="step-builder">
    <header class="step-header">
      <button class="step-header__back" @click="handleBack" aria-label="Go back">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      
      <div class="step-header__info">
        <span class="step-header__label">New Step</span>
        <span 
          class="step-header__type-badge"
          :style="{
            backgroundColor: stepTypeBadgeStyle.bg,
            color: stepTypeBadgeStyle.text,
          }"
        >
          <span 
            class="step-header__type-dot"
            :style="{ backgroundColor: stepTypeBadgeStyle.dot }"
          />
          {{ selectedTypeLabel }}
        </span>
      </div>
      
      <button class="step-header__save-btn" @click="handleSaveStep">
        Save Step
      </button>
    </header>
    
    <main class="step-content">
      <div class="form-section">
        <label class="form-label">Step Type</label>
        <div class="step-type-buttons">
          <button 
            v-for="option in stepTypeOptions"
            :key="option.type"
            class="step-type-btn"
            :class="{ 'step-type-btn--selected': selectedStepType === option.type }"
            @click="handleSelectStepType(option.type)"
          >
            {{ option.label }}
          </button>
        </div>
      </div>
      
      <div class="divider" />
      
      <div class="form-section">
        <div class="form-field-header">
          <label class="form-label">Upload Photo</label>
          <button 
            v-if="imageUrl"
            class="remove-btn"
            @click="handleRemovePhoto"
          >
            Remove
          </button>
        </div>
        
        <div v-if="imageUrl" class="photo-editor">
          <OverlayEditor
            :image-url="imageUrl"
            :overlays="overlays"
            @update:overlays="handleOverlaysUpdate"
          />
        </div>
        <button v-else class="photo-upload" @click="handleUploadPhoto">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
            <path d="M21 15L16 10L5 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>Tap to upload a photo</span>
        </button>
      </div>
      
      <div class="divider" />
      
      <div class="form-section">
        <div class="form-field">
          <label class="form-label">Step Title</label>
          <input 
            v-model="stepTitle"
            type="text"
            class="form-input"
            placeholder="e.g. Enter PIN at gate"
          />
        </div>
        
        <div class="form-field">
          <label class="form-label form-label--optional">Arabic Title</label>
          <input 
            v-model="stepTitleArabic"
            type="text"
            class="form-input"
            dir="rtl"
            placeholder="أدخل العنوان بالعربية"
          />
        </div>
        
        <div class="form-field">
          <label class="form-label">Instructions</label>
          <textarea 
            v-model="instructions"
            class="form-textarea"
            rows="3"
            placeholder="Describe what the courier should do…"
          />
        </div>
        
        <div class="form-field">
          <label class="form-label form-label--optional">Arabic Instructions</label>
          <textarea 
            v-model="instructionsArabic"
            class="form-textarea"
            rows="3"
            dir="rtl"
            placeholder="أضف التعليمات بالعربية…"
          />
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.step-builder {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--color-background);
}

.step-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border-light);
  box-shadow: var(--shadow-md);
  position: sticky;
  top: 0;
  z-index: 100;
}

.step-header__back {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: none;
  border: none;
  border-radius: var(--radius-lg);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.step-header__back:hover {
  background-color: var(--color-background);
  color: var(--color-text);
}

.step-header__info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.step-header__label {
  font-size: 10px;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.step-header__type-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 10px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  line-height: 1.5;
  width: fit-content;
}

.step-header__type-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.step-header__save-btn {
  padding: 8px 16px;
  background-color: var(--color-primary);
  border: none;
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.step-header__save-btn:hover {
  background-color: var(--color-primary-dark);
}

.step-content {
  flex: 1;
  padding: 20px 16px;
  max-width: 100%;
}

@media (min-width: 640px) {
  .step-content {
    max-width: 640px;
    margin: 0 auto;
  }
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.form-field:last-child {
  margin-bottom: 0;
}

.form-field-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.remove-btn {
  background: none;
  border: none;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: color 0.2s ease;
}

.remove-btn:hover {
  color: var(--color-danger);
}

.form-input {
  padding: 12px 16px;
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

.form-textarea {
  padding: 12px 16px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
  font-family: inherit;
  color: var(--color-text);
  resize: vertical;
  min-height: 94px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.form-textarea::placeholder {
  color: var(--color-text-light);
}

.form-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.step-type-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.step-type-btn {
  padding: 8px 13px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.step-type-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.step-type-btn--selected {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
  box-shadow: var(--shadow-button);
}

.step-type-btn--selected:hover {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.divider {
  height: 1px;
  background-color: var(--color-border-light);
  margin: 20px 0;
}

.photo-editor {
  margin-bottom: 8px;
}

.photo-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  height: 200px;
  background-color: var(--color-surface);
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-lg);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.2s ease;
}

.photo-upload:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.photo-upload span {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
}
</style>
