<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import type { StepType, Overlay, GuidanceStep, StepImage, AddressType } from '@guidenav/types';
import { 
  STEP_TYPE_LABELS,
  getStepTypesForAddressType,
} from '@guidenav/types';
import { OverlayEditor, GSpinner } from '@guidenav/ui';
import { 
  createGuidanceStep, 
  updateGuidanceStep, 
  uploadStepImage,
  deleteStepImage,
  deleteGuidanceStep,
  getGuidanceSteps,
  getGuidanceSet
} from '@guidenav/services';
import { validateImageFile } from '@guidenav/core';
import { useAuth } from '../composables/useAuth';

const { userId } = useAuth();

const router = useRouter();
const route = useRoute();
const guidanceSetId = route.params.guidanceSetId as string;
const editStepId = route.query.edit as string | undefined;
const stepIndexParam = route.query.stepIndex as string | undefined;
const addressTypeParam = route.query.addressType as AddressType | undefined;

const addressType = ref<AddressType | null>(addressTypeParam || null);

interface StepTypeOption {
  type: StepType;
  label: string;
  orderHint: string;
  orderIndex: number;
}

const stepTypeOptions = computed<StepTypeOption[]>(() => {
  if (!addressType.value) {
    return Object.entries(STEP_TYPE_LABELS).map(([type, labels]) => ({
      type: type as StepType,
      label: labels.en,
      orderHint: '',
      orderIndex: 99,
    }));
  }
  
  return getStepTypesForAddressType(addressType.value).map(config => ({
    type: config.type,
    label: STEP_TYPE_LABELS[config.type].en,
    orderHint: config.orderHint,
    orderIndex: config.orderIndex,
  }));
});

const suggestedStepType = computed<StepTypeOption | null>(() => {
  if (stepTypeOptions.value.length === 0) return null;
  
  const stepIndex = stepIndexParam !== undefined ? parseInt(stepIndexParam, 10) : 0;
  
  // Find the step type that matches this step index (orderIndex is 1-based)
  const matchingOption = stepTypeOptions.value.find(o => o.orderIndex === stepIndex + 1);
  if (matchingOption) return matchingOption;
  
  // If no exact match, suggest the first available option for new steps
  // or the last option (usually DROP_OFF_POINT or OTHER) for later steps
  if (stepIndex >= stepTypeOptions.value.length) {
    return stepTypeOptions.value[stepTypeOptions.value.length - 1];
  }
  
  return stepTypeOptions.value[stepIndex] || stepTypeOptions.value[0];
});

const defaultStepType = computed<StepType>(() => {
  if (route.query.type) {
    return route.query.type as StepType;
  }
  if (suggestedStepType.value) {
    return suggestedStepType.value.type;
  }
  if (stepTypeOptions.value.length > 0) {
    return stepTypeOptions.value[0].type;
  }
  return 'LOCATION_CHECK';
});

const selectedStepType = ref<StepType>(defaultStepType.value);
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

const fieldErrors = ref<Record<string, string>>({});
const touchedFields = ref<Set<string>>(new Set());
const showAllStepTypes = ref(false);

watch(defaultStepType, (newType) => {
  if (!isEditMode.value && !selectedStepType.value) {
    selectedStepType.value = newType;
  }
});

const selectedTypeLabel = computed(() => {
  const option = stepTypeOptions.value.find(o => o.type === selectedStepType.value);
  return option?.label || STEP_TYPE_LABELS[selectedStepType.value]?.en || selectedStepType.value;
});

const selectedTypeHint = computed(() => {
  const option = stepTypeOptions.value.find(o => o.type === selectedStepType.value);
  return option?.orderHint || '';
});

const stepTypeBadgeStyle = computed(() => {
  const colors: Partial<Record<StepType, { bg: string; dot: string; text: string }>> = {
    LOCATION_CHECK: { bg: '#fffbeb', dot: '#ffb900', text: '#bb4d00' },
    LANDMARK_REFERENCE: { bg: '#f3f4f6', dot: '#99a1af', text: '#4a5565' },
    PARKING_LOCATION: { bg: '#f3f4f6', dot: '#99a1af', text: '#4a5565' },
    BUILDING_ENTRY: { bg: '#eff6ff', dot: '#2b7fff', text: '#1447e6' },
    RECEPTION_OR_SECURITY: { bg: '#faf5ff', dot: '#ad46ff', text: '#8200db' },
    LOBBY_NAVIGATION: { bg: '#f3f4f6', dot: '#99a1af', text: '#4a5565' },
    ELEVATOR_ENTRY: { bg: '#faf5ff', dot: '#ad46ff', text: '#8200db' },
    STAIRS_ENTRY: { bg: '#f3f4f6', dot: '#99a1af', text: '#4a5565' },
    FLOOR_NUMBER: { bg: '#eff6ff', dot: '#2b7fff', text: '#1447e6' },
    CORRIDOR_OR_PATH: { bg: '#f3f4f6', dot: '#99a1af', text: '#4a5565' },
    DOOR_IDENTIFICATION: { bg: '#eff6ff', dot: '#2b7fff', text: '#1447e6' },
    DROP_OFF_POINT: { bg: '#f0fdf4', dot: '#00c950', text: '#008236' },
    GATE_ENTRY: { bg: '#f0fdf4', dot: '#00c950', text: '#008236' },
    UNIT_OR_DOOR_IDENTIFICATION: { bg: '#eff6ff', dot: '#2b7fff', text: '#1447e6' },
    FLOOR_NAVIGATION: { bg: '#f3f4f6', dot: '#99a1af', text: '#4a5565' },
    OTHER: { bg: '#f3f4f6', dot: '#99a1af', text: '#4a5565' },
  };
  return colors[selectedStepType.value] || { bg: '#f3f4f6', dot: '#99a1af', text: '#4a5565' };
});

function getStepTypeColor(type: StepType) {
  const colors: Partial<Record<StepType, { bg: string; border: string; text: string }>> = {
    LOCATION_CHECK: { bg: '#fffbeb', border: '#fcd34d', text: '#b45309' },
    LANDMARK_REFERENCE: { bg: '#f3f4f6', border: '#d1d5db', text: '#4b5563' },
    PARKING_LOCATION: { bg: '#ecfdf5', border: '#6ee7b7', text: '#047857' },
    BUILDING_ENTRY: { bg: '#eff6ff', border: '#93c5fd', text: '#1d4ed8' },
    RECEPTION_OR_SECURITY: { bg: '#faf5ff', border: '#d8b4fe', text: '#7c3aed' },
    LOBBY_NAVIGATION: { bg: '#f3f4f6', border: '#d1d5db', text: '#4b5563' },
    ELEVATOR_ENTRY: { bg: '#faf5ff', border: '#d8b4fe', text: '#7c3aed' },
    STAIRS_ENTRY: { bg: '#f3f4f6', border: '#d1d5db', text: '#4b5563' },
    FLOOR_NUMBER: { bg: '#eff6ff', border: '#93c5fd', text: '#1d4ed8' },
    CORRIDOR_OR_PATH: { bg: '#f3f4f6', border: '#d1d5db', text: '#4b5563' },
    DOOR_IDENTIFICATION: { bg: '#eff6ff', border: '#93c5fd', text: '#1d4ed8' },
    DROP_OFF_POINT: { bg: '#f0fdf4', border: '#86efac', text: '#15803d' },
    GATE_ENTRY: { bg: '#ecfdf5', border: '#6ee7b7', text: '#047857' },
    UNIT_OR_DOOR_IDENTIFICATION: { bg: '#eff6ff', border: '#93c5fd', text: '#1d4ed8' },
    FLOOR_NAVIGATION: { bg: '#f3f4f6', border: '#d1d5db', text: '#4b5563' },
    OTHER: { bg: '#f3f4f6', border: '#d1d5db', text: '#4b5563' },
  };
  return colors[type] || { bg: '#f3f4f6', border: '#d1d5db', text: '#4b5563' };
}

function validateField(field: string): boolean {
  switch (field) {
    case 'stepTitle':
      if (!stepTitle.value.trim()) {
        fieldErrors.value.stepTitle = 'Step title is required';
        return false;
      }
      delete fieldErrors.value.stepTitle;
      return true;
    case 'instructions':
      if (!instructions.value.trim()) {
        fieldErrors.value.instructions = 'Instructions are required';
        return false;
      }
      delete fieldErrors.value.instructions;
      return true;
    default:
      return true;
  }
}

function handleFieldBlur(field: string) {
  touchedFields.value.add(field);
  validateField(field);
}

function validateAllFields(): boolean {
  touchedFields.value.add('stepTitle');
  touchedFields.value.add('instructions');
  
  const titleValid = validateField('stepTitle');
  const instructionsValid = validateField('instructions');
  
  return titleValid && instructionsValid;
}

async function loadGuidanceSetAddressType() {
  if (addressType.value) return;
  
  try {
    const guidanceSet = await getGuidanceSet(guidanceSetId);
    if (guidanceSet?.addressType) {
      addressType.value = guidanceSet.addressType;
    }
  } catch (err) {
    console.error('Failed to load address set:', err);
  }
}

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
  
  const stepIndex = stepIndexParam !== undefined ? parseInt(stepIndexParam, 10) : 0;
  
  try {
    const newId = await createGuidanceStep(guidanceSetId, {
      stepType: selectedStepType.value,
      contentType: 'TEXT',
      title: null,
      instructionOriginal: '',
    }, stepIndex);
    stepId.value = newId;
  } catch (err) {
    console.error('Failed to create step:', err);
    error.value = 'Failed to initialize step. Please try again.';
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await loadGuidanceSetAddressType();
  
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
  if (!validateAllFields()) {
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
      title: stepTitle.value.trim(),
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
  showAllStepTypes.value = false;
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
    
    imageUrl.value = objectUrl;
    imageStoragePath.value = null;
    pendingImage.value = null;
    
    uploading.value = true;
    error.value = null;
    
    try {
      const uploadedImage = await uploadStepImage(guidanceSetId, stepId.value!, file);
      imageStoragePath.value = uploadedImage.storagePath;
      pendingImage.value = uploadedImage;
    } catch (err) {
      console.error('Failed to upload image:', err);
      error.value = 'Failed to upload image. Please try again.';
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
        
        <!-- Step Type Selector - Smart Default with Change Option -->
        <div class="form-section">
          <label class="form-label">Step Type</label>
          
          <!-- Compact Selected View -->
          <div v-if="!showAllStepTypes" class="step-type-selected">
            <div 
              class="step-type-selected__badge"
              :style="{
                backgroundColor: getStepTypeColor(selectedStepType).bg,
                borderColor: getStepTypeColor(selectedStepType).border,
                color: getStepTypeColor(selectedStepType).text,
              }"
            >
              <span class="step-type-selected__label">{{ selectedTypeLabel }}</span>
              <span v-if="selectedTypeHint" class="step-type-selected__hint">{{ selectedTypeHint }}</span>
            </div>
            <button 
              class="step-type-selected__change"
              @click="showAllStepTypes = true"
              :disabled="saving"
            >
              Change
            </button>
          </div>
          
          <!-- Expanded Step Type List -->
          <div v-else class="step-type-picker">
            <div class="step-type-picker__header">
              <span class="step-type-picker__title">Select Step Type</span>
              <button 
                class="step-type-picker__close"
                @click="showAllStepTypes = false"
                aria-label="Close"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
            <p class="step-type-picker__hint">Hints show typical delivery order</p>
            <div class="step-type-picker__list">
              <button 
                v-for="option in stepTypeOptions"
                :key="option.type"
                class="step-type-picker__option"
                :class="{ 
                  'step-type-picker__option--selected': selectedStepType === option.type,
                  'step-type-picker__option--suggested': suggestedStepType?.type === option.type && selectedStepType !== option.type
                }"
                @click="handleSelectStepType(option.type)"
                :disabled="saving"
              >
                <div class="step-type-picker__option-main">
                  <span class="step-type-picker__option-label">{{ option.label }}</span>
                  <span v-if="option.orderHint" class="step-type-picker__option-hint">{{ option.orderHint }}</span>
                </div>
                <svg 
                  v-if="selectedStepType === option.type" 
                  class="step-type-picker__option-check"
                  width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span 
                  v-else-if="suggestedStepType?.type === option.type"
                  class="step-type-picker__option-tag"
                >
                  Suggested
                </span>
              </button>
            </div>
          </div>
        </div>
        
        <div class="divider" />
        
        <!-- Photo Upload -->
        <div class="form-section">
          <div class="form-field-header">
            <label class="form-label form-label--optional">Upload Photo (optional)</label>
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
              :user-id="userId ?? undefined"
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
          
          <input 
            ref="fileInputRef"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            @change="handleFileSelected"
            class="sr-only"
          />
        </div>
        
        <div class="divider" />
        
        <!-- Form Fields -->
        <div class="form-section">
          <div class="form-field" :class="{ 'form-field--error': fieldErrors.stepTitle && touchedFields.has('stepTitle') }">
            <label class="form-label">Step Title <span class="required-star">*</span></label>
            <input 
              v-model="stepTitle"
              type="text"
              class="form-input"
              :class="{ 'form-input--error': fieldErrors.stepTitle && touchedFields.has('stepTitle') }"
              placeholder="e.g. Enter PIN at gate"
              :disabled="saving"
              @blur="handleFieldBlur('stepTitle')"
            />
            <span v-if="fieldErrors.stepTitle && touchedFields.has('stepTitle')" class="field-error">
              {{ fieldErrors.stepTitle }}
            </span>
          </div>
          
          <div class="form-field">
            <label class="form-label form-label--optional">Arabic Title (optional)</label>
            <input 
              v-model="stepTitleArabic"
              type="text"
              class="form-input"
              dir="rtl"
              placeholder="أدخل العنوان بالعربية"
              :disabled="saving"
            />
          </div>
          
          <div class="form-field" :class="{ 'form-field--error': fieldErrors.instructions && touchedFields.has('instructions') }">
            <label class="form-label">Instructions <span class="required-star">*</span></label>
            <textarea 
              v-model="instructions"
              class="form-textarea"
              :class="{ 'form-textarea--error': fieldErrors.instructions && touchedFields.has('instructions') }"
              rows="3"
              placeholder="Describe what the courier should do…"
              :disabled="saving"
              @blur="handleFieldBlur('instructions')"
            />
            <span v-if="fieldErrors.instructions && touchedFields.has('instructions')" class="field-error">
              {{ fieldErrors.instructions }}
            </span>
          </div>
          
          <div class="form-field">
            <label class="form-label form-label--optional">Arabic Instructions (optional)</label>
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

.form-hint {
  margin: 0 0 4px 0;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
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

.form-field--error {
  margin-bottom: 16px;
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

.required-star {
  color: #dc2626;
}

.field-error {
  font-size: var(--font-size-xs);
  color: #dc2626;
  margin-top: 2px;
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

.form-input--error {
  border-color: #dc2626;
}

.form-input--error:focus {
  border-color: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
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

.form-textarea--error {
  border-color: #dc2626;
}

.form-textarea--error:focus {
  border-color: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

/* Step Type Selected - Compact View */
.step-type-selected {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.step-type-selected__badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border: 2px solid;
  border-radius: var(--radius-md);
  font-weight: var(--font-weight-semibold);
}

.step-type-selected__label {
  font-size: var(--font-size-sm);
}

.step-type-selected__hint {
  font-size: 10px;
  font-weight: var(--font-weight-medium);
  padding: 2px 6px;
  background-color: rgba(0, 0, 0, 0.08);
  border-radius: var(--radius-sm);
}

.step-type-selected__change {
  padding: 6px 14px;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.step-type-selected__change:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.step-type-selected__change:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Step Type Picker - Expanded View */
.step-type-picker {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.step-type-picker__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: var(--color-background);
  border-bottom: 1px solid var(--color-border-light);
}

.step-type-picker__title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
}

.step-type-picker__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: none;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.15s ease;
}

.step-type-picker__close:hover {
  background-color: var(--color-surface);
  color: var(--color-text);
}

.step-type-picker__hint {
  margin: 0;
  padding: 8px 16px;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  border-bottom: 1px solid var(--color-border-light);
}

.step-type-picker__list {
  max-height: 280px;
  overflow-y: auto;
}

.step-type-picker__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 12px 16px;
  background: none;
  border: none;
  border-bottom: 1px solid var(--color-border-light);
  cursor: pointer;
  transition: background-color 0.1s ease;
  text-align: left;
}

.step-type-picker__option:last-child {
  border-bottom: none;
}

.step-type-picker__option:hover:not(:disabled) {
  background-color: var(--color-background);
}

.step-type-picker__option:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.step-type-picker__option--selected {
  background-color: var(--color-primary-bg);
}

.step-type-picker__option--selected:hover:not(:disabled) {
  background-color: var(--color-primary-bg);
}

.step-type-picker__option--suggested {
  background-color: #fffbeb;
}

.step-type-picker__option--suggested:hover:not(:disabled) {
  background-color: #fef3c7;
}

.step-type-picker__option-main {
  display: flex;
  align-items: center;
  gap: 10px;
}

.step-type-picker__option-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
}

.step-type-picker__option-hint {
  font-size: 10px;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-muted);
  padding: 2px 8px;
  background-color: var(--color-background);
  border-radius: var(--radius-sm);
}

.step-type-picker__option--selected .step-type-picker__option-hint {
  background-color: rgba(0, 0, 0, 0.06);
}

.step-type-picker__option-check {
  color: var(--color-primary);
  flex-shrink: 0;
}

.step-type-picker__option-tag {
  font-size: 10px;
  font-weight: var(--font-weight-semibold);
  color: #b45309;
  background-color: #fef3c7;
  padding: 3px 8px;
  border-radius: var(--radius-sm);
  text-transform: uppercase;
  letter-spacing: 0.03em;
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
