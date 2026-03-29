<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import type { StepType, Overlay, GuidanceStep, StepImage } from '@guidenav/types';
import { OverlayEditor, GSpinner } from '@guidenav/ui';
import { 
  createGuidanceStep, 
  updateGuidanceStep, 
  uploadStepImage,
  deleteStepImage,
  deleteGuidanceStep,
  getGuidanceSteps
} from '@guidenav/services';
import { validateImageFile } from '@guidenav/core';
import { useAuth } from '../composables/useAuth';

const { userId } = useAuth();

const router = useRouter();
const route = useRoute();
const guidanceSetId = route.params.guidanceSetId as string;
const editStepId = route.query.edit as string | undefined;

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
const imageStoragePath = ref<string | null>(null);
const overlays = ref<Overlay[]>([]);
const loading = ref(false);
const saving = ref(false);
const uploading = ref(false);
const error = ref<string | null>(null);
const existingStep = ref<GuidanceStep | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const pendingImage = ref<StepImage | null>(null);

const stepId = ref<string | null>(editStepId || null);
const stepSaved = ref(false);
const isNewStep = computed(() => !editStepId);
const isEditMode = computed(() => !!editStepId);

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

async function loadExistingStep() {
  if (!editStepId) return;
  
  loading.value = true;
  error.value = null;
  
  try {
    const steps = await getGuidanceSteps(guidanceSetId);
    const step = steps.find(s => s.id === editStepId);
    
    if (!step) {
      error.value = 'Step not found';
      return;
    }
    
    existingStep.value = step;
    selectedStepType.value = step.stepType;
    stepTitle.value = step.title || '';
    instructions.value = step.instructionOriginal;
    imageUrl.value = step.image?.publicUrl || null;
    imageStoragePath.value = step.image?.storagePath || null;
    overlays.value = step.overlays || [];
  } catch (err) {
    console.error('Failed to load step:', err);
    error.value = 'Failed to load step. Please try again.';
  } finally {
    loading.value = false;
  }
}

async function createNewStep() {
  loading.value = true;
  error.value = null;
  
  try {
    const newId = await createGuidanceStep(guidanceSetId, {
      stepType: selectedStepType.value,
      contentType: 'TEXT',
      title: null,
      instructionOriginal: '',
    });
    stepId.value = newId;
  } catch (err) {
    console.error('Failed to create step:', err);
    error.value = 'Failed to initialize step. Please try again.';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  if (isEditMode.value) {
    loadExistingStep();
  } else {
    createNewStep();
  }
});

onBeforeUnmount(async () => {
  if (isNewStep.value && stepId.value && !stepSaved.value) {
    try {
      await deleteGuidanceStep(stepId.value);
      if (imageStoragePath.value) {
        await deleteStepImage(imageStoragePath.value);
      }
    } catch (e) {
      console.error('Failed to cleanup orphan step:', e);
    }
  }
});

function handleBack() {
  router.push(`/guidance/${guidanceSetId}/edit`);
}

async function handleSaveStep() {
  if (!instructions.value.trim()) {
    error.value = 'Instructions are required';
    return;
  }
  
  if (!stepId.value) {
    error.value = 'Step not initialized. Please refresh and try again.';
    return;
  }
  
  if (uploading.value) {
    error.value = 'Please wait for image upload to complete';
    return;
  }
  
  // Check if there's an image preview but upload failed
  if (imageUrl.value && !pendingImage.value && !existingStep.value?.image) {
    error.value = 'Image upload failed. Please remove and re-upload the image.';
    return;
  }
  
  saving.value = true;
  error.value = null;
  
  try {
    await updateGuidanceStep(stepId.value, {
      stepType: selectedStepType.value,
      contentType: imageUrl.value ? 'PHOTO' : 'TEXT',
      title: stepTitle.value.trim() || null,
      instructionOriginal: instructions.value.trim(),
      overlays: overlays.value,
      image: pendingImage.value ?? existingStep.value?.image ?? null,
    });
    
    stepSaved.value = true;
    router.push(`/guidance/${guidanceSetId}/edit`);
  } catch (err) {
    console.error('Failed to save step:', err);
    error.value = 'Failed to save step. Please try again.';
  } finally {
    saving.value = false;
  }
}

function handleSelectStepType(type: StepType) {
  selectedStepType.value = type;
}

function triggerFileInput() {
  fileInputRef.value?.click();
}

async function handleFileSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  
  if (!file) return;
  
  if (!stepId.value) {
    error.value = 'Step not initialized. Please wait and try again.';
    input.value = '';
    return;
  }
  
  const img = new Image();
  const objectUrl = URL.createObjectURL(file);
  
  img.onload = async () => {
    const validation = validateImageFile({
      size: file.size,
      type: file.type,
      width: img.width,
      height: img.height,
    });
    
    if (!validation.valid) {
      URL.revokeObjectURL(objectUrl);
      error.value = validation.errors.join('. ');
      input.value = '';
      return;
    }
    
    // Show local preview immediately
    imageUrl.value = objectUrl;
    imageStoragePath.value = null;
    pendingImage.value = null;
    
    // Upload in background
    uploading.value = true;
    error.value = null;
    
    try {
      const uploadedImage = await uploadStepImage(guidanceSetId, stepId.value!, file);
      imageStoragePath.value = uploadedImage.storagePath;
      pendingImage.value = uploadedImage;
      // Keep showing local blob URL - it's faster than fetching the uploaded one
    } catch (err) {
      console.error('Failed to upload image:', err);
      error.value = 'Failed to upload image. Please try again.';
      // Keep the preview but mark as not uploaded
      imageStoragePath.value = null;
      pendingImage.value = null;
    } finally {
      uploading.value = false;
      input.value = '';
    }
  };
  
  img.onerror = () => {
    URL.revokeObjectURL(objectUrl);
    error.value = 'Invalid image file';
    input.value = '';
  };
  
  img.src = objectUrl;
}

async function handleRemovePhoto() {
  // Revoke blob URL if it's a local preview
  if (imageUrl.value && imageUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(imageUrl.value);
  }
  
  if (imageStoragePath.value) {
    try {
      await deleteStepImage(imageStoragePath.value);
    } catch (err) {
      console.error('Failed to delete image:', err);
    }
  }
  
  imageUrl.value = null;
  imageStoragePath.value = null;
  overlays.value = [];
  pendingImage.value = null;
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
        <span class="step-header__label">{{ isEditMode ? 'Edit Step' : 'New Step' }}</span>
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
      
      <button 
        class="step-header__save-btn" 
        @click="handleSaveStep"
        :disabled="saving || uploading || loading"
      >
        {{ saving ? 'Saving...' : 'Save Step' }}
      </button>
    </header>
    
    <main class="step-content">
      <div v-if="loading" class="step-loading">
        <GSpinner />
      </div>
      
      <template v-else>
        <div v-if="error" class="error-banner">
          <p class="error-banner__text">{{ error }}</p>
          <button class="error-banner__dismiss" @click="error = null" aria-label="Dismiss">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        
        <div class="form-section">
          <label class="form-label">Step Type</label>
          <div class="step-type-buttons">
            <button 
              v-for="option in stepTypeOptions"
              :key="option.type"
              class="step-type-btn"
              :class="{ 'step-type-btn--selected': selectedStepType === option.type }"
              @click="handleSelectStepType(option.type)"
              :disabled="saving"
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
              :disabled="uploading"
            >
              Remove
            </button>
          </div>
          
          <div v-if="imageUrl" class="photo-editor">
            <OverlayEditor
              :image-url="imageUrl"
              :overlays="overlays"
              :user-id="userId"
              @update:overlays="handleOverlaysUpdate"
            />
            <div v-if="uploading" class="upload-indicator">
              <GSpinner size="sm" />
              <span>Uploading...</span>
            </div>
          </div>
          <div v-else-if="uploading" class="upload-progress">
            <GSpinner />
            <span>Uploading...</span>
          </div>
          <button v-else class="photo-upload" @click="triggerFileInput" :disabled="saving">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
              <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
              <path d="M21 15L16 10L5 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>Tap to take or choose a photo</span>
          </button>
          
          <!-- Native file input - no capture attribute to allow photo library selection on mobile -->
          <input 
            ref="fileInputRef"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            @change="handleFileSelected"
            class="sr-only"
          />
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
              :disabled="saving"
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
              :disabled="saving"
            />
          </div>
          
          <div class="form-field">
            <label class="form-label">Instructions</label>
            <textarea 
              v-model="instructions"
              class="form-textarea"
              rows="3"
              placeholder="Describe what the courier should do…"
              :disabled="saving"
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
              :disabled="saving"
            />
          </div>
        </div>
      </template>
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

.step-header__save-btn:hover:not(:disabled) {
  background-color: var(--color-primary-dark);
}

.step-header__save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

.step-loading {
  display: flex;
  justify-content: center;
  padding: 48px 0;
}

.error-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 13px 17px;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: var(--radius-lg);
  margin-bottom: 16px;
}

.error-banner__text {
  margin: 0;
  font-size: var(--font-size-sm);
  color: #dc2626;
  line-height: 1.6;
}

.error-banner__dismiss {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: none;
  border: none;
  border-radius: var(--radius-sm);
  color: #dc2626;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.error-banner__dismiss:hover {
  background-color: #fee2e2;
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

.remove-btn:hover:not(:disabled) {
  color: var(--color-danger);
}

.remove-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

.form-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

.form-textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

.step-type-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.step-type-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.step-type-btn--selected {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
  box-shadow: var(--shadow-button);
}

.step-type-btn--selected:hover:not(:disabled) {
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
  position: relative;
  margin-bottom: 8px;
}

.upload-indicator {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: rgba(0, 0, 0, 0.7);
  border-radius: var(--radius-md);
  color: white;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  z-index: 10;
}

.upload-progress {
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
}

.upload-progress span {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
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

.photo-upload:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.photo-upload:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.photo-upload span {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
