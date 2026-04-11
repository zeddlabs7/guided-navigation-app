<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { StepCard, GSpinner } from '@guidenav/ui';
import type { GuidanceStatus, StepType, GuidanceStep, AddressType, MetadataFieldConfig, UnitType } from '@guidenav/types';
import { ADDRESS_TYPE_LABELS, ADDRESS_TYPE_STEP_CONFIG } from '@guidenav/types';
import { 
  getGuidanceSet, 
  getGuidanceSteps, 
  updateGuidanceSet, 
  deleteGuidanceStep,
  reorderGuidanceSteps,
  deleteGuidanceSet
} from '@guidenav/services';

const router = useRouter();
const route = useRoute();
const guidanceSetId = route.params.guidanceSetId as string;

type FormStep = 'title' | 'addressType' | 'metadata' | 'steps';

const currentFormStep = ref<FormStep>('steps');
const title = ref('');
const titleArabic = ref('');
const status = ref<GuidanceStatus>('DRAFT');
const addressType = ref<AddressType | null>(null);

const metadataValues = ref<Record<string, string>>({
  buildingNumber: '',
  floorNumber: '',
  doorNumber: '',
  compoundName: '',
  gateNumber: '',
  unitType: '',
  villaNumber: '',
  apartmentNumber: '',
  locationDescription: '',
});

const loading = ref(true);
const saving = ref(false);
const error = ref<string | null>(null);

const fieldErrors = ref<Record<string, string>>({});
const touchedFields = ref<Set<string>>(new Set());

const addressTypeOptions: { type: AddressType; label: string; icon: string }[] = [
  { type: 'APARTMENT_BUILDING', label: ADDRESS_TYPE_LABELS.APARTMENT_BUILDING.en, icon: '🏢' },
  { type: 'VILLA', label: ADDRESS_TYPE_LABELS.VILLA.en, icon: '🏠' },
  { type: 'RESIDENTIAL_COMPOUND', label: ADDRESS_TYPE_LABELS.RESIDENTIAL_COMPOUND.en, icon: '🏘️' },
  { type: 'OFFICE_BUILDING', label: ADDRESS_TYPE_LABELS.OFFICE_BUILDING.en, icon: '🏛️' },
  { type: 'OTHER', label: ADDRESS_TYPE_LABELS.OTHER.en, icon: '📍' },
];

const unitTypeOptions: { value: UnitType; label: string }[] = [
  { value: 'villa', label: 'Villa' },
  { value: 'apartment', label: 'Apartment' },
];

const requiresMetadata = computed(() => {
  if (!addressType.value) return false;
  return ADDRESS_TYPE_STEP_CONFIG[addressType.value].requiresMetadata;
});

const currentFieldConfigs = computed((): MetadataFieldConfig[] => {
  if (!addressType.value) return [];
  const config = ADDRESS_TYPE_STEP_CONFIG[addressType.value];
  return config.metadataFieldConfigs || [];
});

const visibleFieldConfigs = computed((): MetadataFieldConfig[] => {
  return currentFieldConfigs.value.filter(fieldConfig => {
    if (!fieldConfig.dependsOn) return true;
    return metadataValues.value[fieldConfig.dependsOn.field] === fieldConfig.dependsOn.value;
  });
});

const metadataSectionTitle = computed(() => {
  if (!addressType.value) return 'Details';
  return ADDRESS_TYPE_STEP_CONFIG[addressType.value].sectionTitle?.en || 'Details';
});

function validateMetadataField(field: string): boolean {
  const fieldConfig = currentFieldConfigs.value.find(f => f.field === field);
  if (!fieldConfig) return true;
  
  if (fieldConfig.dependsOn) {
    const dependentValue = metadataValues.value[fieldConfig.dependsOn.field];
    if (dependentValue !== fieldConfig.dependsOn.value) {
      delete fieldErrors.value[field];
      return true;
    }
  }
  
  if (fieldConfig.required && !metadataValues.value[field]?.trim()) {
    fieldErrors.value[field] = `${fieldConfig.label.en} is required`;
    return false;
  }
  
  delete fieldErrors.value[field];
  return true;
}

function handleFieldBlur(field: string) {
  touchedFields.value.add(field);
  validateMetadataField(field);
}

function getFieldShortLabel(field: string): string {
  const shortLabels: Record<string, string> = {
    buildingNumber: 'Bldg',
    floorNumber: 'Floor',
    doorNumber: 'Unit',
    compoundName: 'Compound',
    gateNumber: 'Gate',
    unitType: 'Type',
    villaNumber: 'Villa',
    apartmentNumber: 'Apt',
    locationDescription: 'Location',
  };
  return shortLabels[field] || field;
}

function getDisplayValue(field: string): string {
  const value = metadataValues.value[field];
  if (field === 'unitType') {
    return value === 'villa' ? 'Villa' : value === 'apartment' ? 'Apartment' : value;
  }
  return value;
}

interface StepData {
  id: string;
  stepType: StepType;
  title: string;
  instructions: string;
  imageUrl: string | null;
  overlays: import('@guidenav/types').Overlay[];
}

const steps = ref<StepData[]>([]);
const originalSteps = ref<GuidanceStep[]>([]);

async function loadGuidanceSet() {
  loading.value = true;
  error.value = null;
  
  try {
    const [guidanceSet, guidanceSteps] = await Promise.all([
      getGuidanceSet(guidanceSetId),
      getGuidanceSteps(guidanceSetId),
    ]);
    
    if (!guidanceSet) {
      error.value = 'Address set not found';
      return;
    }
    
    title.value = guidanceSet.title;
    status.value = guidanceSet.status;
    addressType.value = guidanceSet.addressType || null;
    
    metadataValues.value = {
      buildingNumber: guidanceSet.buildingNumber || '',
      floorNumber: guidanceSet.floorNumber || '',
      doorNumber: guidanceSet.doorNumber || '',
      compoundName: guidanceSet.compoundName || '',
      gateNumber: guidanceSet.gateNumber || '',
      unitType: guidanceSet.unitType || '',
      villaNumber: guidanceSet.villaNumber || '',
      apartmentNumber: guidanceSet.apartmentNumber || '',
      locationDescription: guidanceSet.locationDescription || '',
    };
    
    originalSteps.value = guidanceSteps;
    
    steps.value = guidanceSteps.map(step => ({
      id: step.id,
      stepType: step.stepType,
      title: step.title || '',
      instructions: step.instructionOriginal,
      imageUrl: step.image?.publicUrl || null,
      overlays: step.overlays || [],
    }));
  } catch (err) {
    console.error('Failed to load address set:', err);
    error.value = 'Failed to load address set. Please try again.';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadGuidanceSet();
});

const stepCount = computed(() => steps.value.length);
const displayTitle = computed(() => title.value || 'Untitled Address');

const statusConfig: Record<GuidanceStatus, { bg: string; dot: string; text: string; label: string }> = {
  PUBLISHED: { bg: '#f0fdf4', dot: '#00c950', text: '#008236', label: 'Published' },
  DRAFT: { bg: '#fffbeb', dot: '#ffb900', text: '#bb4d00', label: 'Draft' },
  DISABLED: { bg: '#f3f4f6', dot: '#99a1af', text: '#6a7282', label: 'Disabled' },
};

function handleBack() {
  if (currentFormStep.value === 'addressType') {
    currentFormStep.value = 'title';
  } else if (currentFormStep.value === 'metadata') {
    currentFormStep.value = 'addressType';
  } else if (currentFormStep.value === 'steps') {
    if (requiresMetadata.value) {
      currentFormStep.value = 'metadata';
    } else {
      currentFormStep.value = 'addressType';
    }
  } else {
    router.push('/dashboard');
  }
}

function handleGoToDashboard() {
  router.push('/dashboard');
}

function handleContinueFromTitle() {
  if (!title.value.trim()) {
    error.value = 'Title is required';
    return;
  }
  error.value = null;
  currentFormStep.value = 'addressType';
}

function handleSelectAddressType(type: AddressType) {
  addressType.value = type;
  error.value = null;
}

function handleContinueFromAddressType() {
  if (!addressType.value) {
    error.value = 'Please select an address type';
    return;
  }
  
  error.value = null;
  
  if (ADDRESS_TYPE_STEP_CONFIG[addressType.value].requiresMetadata) {
    currentFormStep.value = 'metadata';
  } else {
    Object.keys(metadataValues.value).forEach(key => {
      metadataValues.value[key] = '';
    });
    currentFormStep.value = 'steps';
  }
}

function handleContinueFromMetadata() {
  let allValid = true;
  
  for (const fieldConfig of visibleFieldConfigs.value) {
    touchedFields.value.add(fieldConfig.field);
    if (!validateMetadataField(fieldConfig.field)) {
      allValid = false;
    }
  }
  
  if (!allValid) {
    error.value = 'Please fill in all required fields';
    return;
  }
  
  error.value = null;
  currentFormStep.value = 'steps';
}

function buildMetadataPayload() {
  const payload: Record<string, string | undefined> = {};
  
  for (const fieldConfig of visibleFieldConfigs.value) {
    const value = metadataValues.value[fieldConfig.field]?.trim();
    if (value) {
      payload[fieldConfig.field] = value;
    }
  }
  
  return payload;
}

async function handleSaveDraft() {
  if (!title.value.trim()) {
    error.value = 'Title is required';
    return;
  }
  
  if (!addressType.value) {
    error.value = 'Address type is required';
    return;
  }
  
  saving.value = true;
  error.value = null;
  
  try {
    await updateGuidanceSet(guidanceSetId, {
      title: title.value.trim(),
      addressType: addressType.value,
      ...(requiresMetadata.value && buildMetadataPayload()),
    });
    
    const currentStepIds = steps.value.map(s => s.id);
    await reorderGuidanceSteps(guidanceSetId, currentStepIds);
  } catch (err) {
    console.error('Failed to save guidance set:', err);
    error.value = 'Failed to save. Please try again.';
  } finally {
    saving.value = false;
  }
}

function handlePreviewAndPublish() {
  router.push(`/guidance/${guidanceSetId}/preview`);
}

function handleAddStep() {
  const params = new URLSearchParams();
  params.set('stepIndex', String(steps.value.length));
  if (addressType.value) {
    params.set('addressType', addressType.value);
  }
  router.push(`/guidance/${guidanceSetId}/steps?${params.toString()}`);
}

async function handleMoveUp(index: number) {
  if (index > 0) {
    const temp = steps.value[index];
    steps.value[index] = steps.value[index - 1];
    steps.value[index - 1] = temp;
    
    try {
      const stepIds = steps.value.map(s => s.id);
      await reorderGuidanceSteps(guidanceSetId, stepIds);
    } catch (err) {
      console.error('Failed to reorder steps:', err);
      steps.value[index - 1] = steps.value[index];
      steps.value[index] = temp;
    }
  }
}

async function handleMoveDown(index: number) {
  if (index < steps.value.length - 1) {
    const temp = steps.value[index];
    steps.value[index] = steps.value[index + 1];
    steps.value[index + 1] = temp;
    
    try {
      const stepIds = steps.value.map(s => s.id);
      await reorderGuidanceSteps(guidanceSetId, stepIds);
    } catch (err) {
      console.error('Failed to reorder steps:', err);
      steps.value[index + 1] = steps.value[index];
      steps.value[index] = temp;
    }
  }
}

function handleEditStep(stepId: string) {
  const params = new URLSearchParams();
  params.set('edit', stepId);
  if (addressType.value) {
    params.set('addressType', addressType.value);
  }
  router.push(`/guidance/${guidanceSetId}/steps?${params.toString()}`);
}

async function handleDeleteStep(index: number) {
  const step = steps.value[index];
  const confirmed = window.confirm(`Are you sure you want to delete this step?`);
  if (!confirmed) return;
  
  const removedStep = steps.value.splice(index, 1)[0];
  
  try {
    await deleteGuidanceStep(step.id);
  } catch (err) {
    console.error('Failed to delete step:', err);
    steps.value.splice(index, 0, removedStep);
    alert('Failed to delete step. Please try again.');
  }
}

async function handleDeleteGuidance() {
  const confirmed = window.confirm(`Are you sure you want to delete "${title.value}"? This action cannot be undone.`);
  if (!confirmed) return;
  
  saving.value = true;
  
  try {
    await deleteGuidanceSet(guidanceSetId);
    router.push('/dashboard');
  } catch (err) {
    console.error('Failed to delete guidance set:', err);
    alert('Failed to delete. Please try again.');
    saving.value = false;
  }
}
</script>

<template>
  <div class="edit-page">
    <header class="edit-header">
      <div class="edit-header__nav">
        <button class="edit-header__back" @click="handleBack" aria-label="Go back" title="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <button class="edit-header__dashboard" @click="handleGoToDashboard" aria-label="Go to dashboard" title="Dashboard">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M9 22V12H15V22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
      
      <div class="edit-header__info">
        <span class="edit-header__label">Edit Address</span>
        <span class="edit-header__title">{{ displayTitle }}</span>
      </div>
      
      <span 
        v-if="!loading"
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
      
      <button 
        v-if="currentFormStep === 'steps'"
        class="edit-header__save-btn" 
        @click="handleSaveDraft"
        :disabled="saving || loading"
      >
        {{ saving ? 'Saving...' : 'Save' }}
      </button>
    </header>
    
    <main class="edit-content">
      <div v-if="loading" class="edit-loading">
        <GSpinner />
      </div>
      
      <template v-else-if="error && !title">
        <div class="error-state">
          <p class="error-state__title">Something went wrong</p>
          <p class="error-state__description">{{ error }}</p>
          <button class="error-state__retry" @click="loadGuidanceSet">
            Try Again
          </button>
          <button class="error-state__back" @click="() => router.push('/dashboard')">
            Back to Dashboard
          </button>
        </div>
      </template>
      
      <template v-else>
        <div v-if="error" class="error-banner">
          <p class="error-banner__text">{{ error }}</p>
          <button class="error-banner__dismiss" @click="error = null" aria-label="Dismiss">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        
        <div class="warning-banner">
          <svg class="warning-banner__icon" width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 9V13M12 17H12.01M10.29 3.86L1.82 18C1.64 18.3 1.55 18.64 1.55 19C1.55 19.36 1.64 19.7 1.82 20C2 20.3 2.26 20.56 2.58 20.74C2.9 20.92 3.26 21.01 3.64 21H20.36C20.74 21.01 21.1 20.92 21.42 20.74C21.74 20.56 22 20.3 22.18 20C22.36 19.7 22.45 19.36 22.45 19C22.45 18.64 22.36 18.3 22.18 18L13.71 3.86C13.53 3.56 13.27 3.32 12.95 3.16C12.63 3 12.28 2.92 11.91 2.93C11.54 2.94 11.19 3.04 10.89 3.21C10.59 3.38 10.34 3.63 10.17 3.93L10.29 3.86Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <p class="warning-banner__text">
            Avoid uploading faces, license plates, or private documents.
          </p>
        </div>

        <!-- Progress indicator -->
        <div class="progress-steps">
          <div 
            class="progress-step" 
            :class="{ 
              'progress-step--active': currentFormStep === 'title', 
              'progress-step--completed': currentFormStep !== 'title',
              'progress-step--clickable': currentFormStep !== 'title'
            }"
            @click="currentFormStep !== 'title' && (currentFormStep = 'title')"
          >
            <span class="progress-step__number">1</span>
            <span class="progress-step__label">Title</span>
          </div>
          <div class="progress-step__line" :class="{ 'progress-step__line--completed': currentFormStep !== 'title' }" />
          <div 
            class="progress-step" 
            :class="{ 
              'progress-step--active': currentFormStep === 'addressType', 
              'progress-step--completed': currentFormStep === 'metadata' || currentFormStep === 'steps',
              'progress-step--clickable': currentFormStep === 'metadata' || currentFormStep === 'steps'
            }"
            @click="(currentFormStep === 'metadata' || currentFormStep === 'steps') && (currentFormStep = 'addressType')"
          >
            <span class="progress-step__number">2</span>
            <span class="progress-step__label">Type</span>
          </div>
          <template v-if="requiresMetadata">
            <div class="progress-step__line" :class="{ 'progress-step__line--completed': currentFormStep === 'metadata' || currentFormStep === 'steps' }" />
            <div 
              class="progress-step" 
              :class="{ 
                'progress-step--active': currentFormStep === 'metadata',
                'progress-step--completed': currentFormStep === 'steps',
                'progress-step--clickable': currentFormStep === 'steps'
              }"
              @click="currentFormStep === 'steps' && (currentFormStep = 'metadata')"
            >
              <span class="progress-step__number">3</span>
              <span class="progress-step__label">Details</span>
            </div>
          </template>
          <div class="progress-step__line" :class="{ 'progress-step__line--completed': currentFormStep === 'steps' }" />
          <div 
            class="progress-step" 
            :class="{ 'progress-step--active': currentFormStep === 'steps' }"
          >
            <span class="progress-step__number">{{ requiresMetadata ? '4' : '3' }}</span>
            <span class="progress-step__label">Steps</span>
          </div>
        </div>
        
        <!-- Step 1: Title -->
        <div v-if="currentFormStep === 'title'" class="form-section">
          <h2 class="section-title">Address Details</h2>
          <div class="form-field">
            <label class="form-label">Address Title <span class="required-star">*</span></label>
            <input 
              v-model="title"
              type="text"
              class="form-input"
              placeholder="e.g. Al Nakheel Tower – Delivery Guide"
              :disabled="saving"
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
              :disabled="saving"
            />
          </div>
          
          <button 
            class="continue-btn" 
            @click="handleContinueFromTitle"
            :disabled="saving"
          >
            Continue
          </button>
        </div>
        
        <!-- Step 2: Address Type -->
        <div v-else-if="currentFormStep === 'addressType'" class="form-section">
          <h2 class="section-title">Address Type</h2>
          <p class="section-subtitle">What type of address is this?</p>
          
          <div class="address-type-grid">
            <button
              v-for="option in addressTypeOptions"
              :key="option.type"
              class="address-type-card"
              :class="{ 'address-type-card--selected': addressType === option.type }"
              @click="handleSelectAddressType(option.type)"
              :disabled="saving"
            >
              <span class="address-type-card__icon">{{ option.icon }}</span>
              <span class="address-type-card__label">{{ option.label }}</span>
            </button>
          </div>
          
          <button 
            class="continue-btn" 
            @click="handleContinueFromAddressType"
            :disabled="saving || !addressType"
          >
            Continue
          </button>
        </div>
        
        <!-- Step 3: Metadata (Dynamic based on address type) -->
        <div v-else-if="currentFormStep === 'metadata'" class="form-section">
          <h2 class="section-title">{{ metadataSectionTitle }}</h2>
          <p class="section-subtitle">These details help couriers find you faster</p>
          
          <template v-for="fieldConfig in visibleFieldConfigs" :key="fieldConfig.field">
            <!-- Unit Type Dropdown -->
            <div 
              v-if="fieldConfig.field === 'unitType'" 
              class="form-field" 
              :class="{ 'form-field--error': fieldErrors[fieldConfig.field] && touchedFields.has(fieldConfig.field) }"
            >
              <label class="form-label">
                {{ fieldConfig.label.en }}
                <span v-if="fieldConfig.required" class="required-star">*</span>
              </label>
              <select
                v-model="metadataValues[fieldConfig.field]"
                class="form-select"
                :class="{ 'form-select--error': fieldErrors[fieldConfig.field] && touchedFields.has(fieldConfig.field) }"
                :disabled="saving"
                @blur="handleFieldBlur(fieldConfig.field)"
                @change="handleFieldBlur(fieldConfig.field)"
              >
                <option value="" disabled>{{ fieldConfig.placeholder.en }}</option>
                <option v-for="option in unitTypeOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
              <span v-if="fieldErrors[fieldConfig.field] && touchedFields.has(fieldConfig.field)" class="field-error">
                {{ fieldErrors[fieldConfig.field] }}
              </span>
            </div>
            
            <!-- Text Input Fields -->
            <div 
              v-else
              class="form-field" 
              :class="{ 'form-field--error': fieldErrors[fieldConfig.field] && touchedFields.has(fieldConfig.field) }"
            >
              <label class="form-label">
                {{ fieldConfig.label.en }}
                <span v-if="fieldConfig.required" class="required-star">*</span>
              </label>
              <input 
                v-model="metadataValues[fieldConfig.field]"
                type="text"
                class="form-input"
                :class="{ 'form-input--error': fieldErrors[fieldConfig.field] && touchedFields.has(fieldConfig.field) }"
                :placeholder="fieldConfig.placeholder.en"
                :disabled="saving"
                @blur="handleFieldBlur(fieldConfig.field)"
              />
              <span v-if="fieldErrors[fieldConfig.field] && touchedFields.has(fieldConfig.field)" class="field-error">
                {{ fieldErrors[fieldConfig.field] }}
              </span>
            </div>
          </template>
          
          <button 
            class="continue-btn" 
            @click="handleContinueFromMetadata"
            :disabled="saving"
          >
            Continue to Steps
          </button>
        </div>
        
        <!-- Step 4: Steps -->
        <div v-else-if="currentFormStep === 'steps'" class="steps-section">
          <!-- Address Type Summary -->
          <div v-if="addressType" class="address-summary">
            <div class="address-summary__type">
              <span class="address-summary__icon">{{ addressTypeOptions.find(o => o.type === addressType)?.icon }}</span>
              <span class="address-summary__label">{{ addressTypeOptions.find(o => o.type === addressType)?.label }}</span>
            </div>
            <div v-if="Object.values(metadataValues).some(v => v)" class="address-summary__details">
              <template v-for="fieldConfig in visibleFieldConfigs" :key="fieldConfig.field">
                <span 
                  v-if="metadataValues[fieldConfig.field]" 
                  class="address-summary__detail"
                >
                  {{ getFieldShortLabel(fieldConfig.field) }}: {{ getDisplayValue(fieldConfig.field) }}
                </span>
              </template>
            </div>
          </div>
          
          <div class="steps-header">
            <h2 class="steps-title">Steps</h2>
            <span class="steps-count">{{ stepCount }}</span>
          </div>
          
          <div v-if="steps.length === 0" class="steps-empty">
            <div class="steps-empty__icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M12 11V8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <circle cx="12" cy="14" r="1" fill="currentColor"/>
              </svg>
            </div>
            <h3 class="steps-empty__title">Add step-by-step guidance for couriers</h3>
            <p class="steps-empty__subtitle">Help delivery couriers complete deliveries by adding:</p>
            <ul class="steps-empty__examples">
              <li>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                  <path d="M21 15L16 10L5 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>Photos with arrows pointing to entrances</span>
              </li>
              <li>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M14 2V8H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M16 13H8M16 17H8M10 9H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>Instructions for parking or access codes</span>
              </li>
              <li>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="2"/>
                </svg>
                <span>Markers highlighting key landmarks</span>
              </li>
            </ul>
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
              :overlays="step.overlays"
              :is-first="index === 0"
              :is-last="index === steps.length - 1"
              @move-up="handleMoveUp(index)"
              @move-down="handleMoveDown(index)"
              @edit="handleEditStep(step.id)"
              @delete="handleDeleteStep(index)"
            />
          </div>
          
          <button class="add-step-btn" @click="handleAddStep" :disabled="saving">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            {{ steps.length === 0 ? 'Add First Step' : 'Add Step' }}
          </button>
          
          <div class="divider" />
          
          <div class="danger-zone">
            <button class="delete-btn" @click="handleDeleteGuidance" :disabled="saving">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 6H5H21M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Delete Address
            </button>
          </div>
        </div>
      </template>
    </main>
    
    <footer v-if="!loading && title && currentFormStep === 'steps'" class="edit-footer">
      <button 
        class="footer-btn footer-btn--secondary" 
        @click="handleSaveDraft"
        :disabled="saving"
      >
        {{ saving ? 'Saving...' : 'Save Draft' }}
      </button>
      <button 
        class="footer-btn footer-btn--primary" 
        @click="handlePreviewAndPublish"
        :disabled="saving"
      >
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

.edit-header__nav {
  display: flex;
  align-items: center;
  gap: 4px;
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

.edit-header__dashboard {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: none;
  border: none;
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.2s ease;
}

.edit-header__dashboard:hover {
  background-color: var(--color-background);
  color: var(--color-primary);
}

.edit-header__info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
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

.edit-header__save-btn:hover:not(:disabled) {
  background-color: var(--color-primary-dark);
}

.edit-header__save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

.edit-loading {
  display: flex;
  justify-content: center;
  padding: 48px 0;
}

.error-state {
  text-align: center;
  padding: 48px 24px;
}

.error-state__title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  margin: 0 0 8px;
}

.error-state__description {
  font-size: var(--font-size-base);
  color: var(--color-text-muted);
  margin: 0 0 24px;
}

.error-state__retry,
.error-state__back {
  display: block;
  width: 100%;
  max-width: 200px;
  margin: 0 auto 12px;
  padding: 12px 24px;
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all 0.2s ease;
}

.error-state__retry {
  background-color: var(--color-primary);
  border: none;
  color: white;
}

.error-state__retry:hover {
  background-color: var(--color-primary-dark);
}

.error-state__back {
  background: none;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
}

.error-state__back:hover {
  background-color: var(--color-background);
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

/* Progress Steps */
.progress-steps {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 24px;
}

.progress-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.progress-step--clickable {
  cursor: pointer;
}

.progress-step__number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: var(--color-border-light);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  transition: all 0.2s ease;
}

.progress-step--active .progress-step__number {
  background-color: var(--color-primary);
  color: white;
}

.progress-step--completed .progress-step__number {
  background-color: var(--color-success);
  color: white;
}

.progress-step--clickable:hover .progress-step__number {
  transform: scale(1.1);
}

.progress-step__label {
  font-size: 10px;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.progress-step--active .progress-step__label {
  color: var(--color-primary);
  font-weight: var(--font-weight-medium);
}

.progress-step__line {
  width: 32px;
  height: 2px;
  background-color: var(--color-border-light);
  margin-bottom: 18px;
  transition: background-color 0.2s ease;
}

.progress-step__line--completed {
  background-color: var(--color-success);
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title {
  margin: 0 0 4px 0;
  font-size: 20px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
}

.section-subtitle {
  margin: 0 0 12px 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
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

.required-star {
  color: #dc2626;
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

.form-select {
  padding: 14px 16px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
  color: var(--color-text);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M2.5 4.5L6 8l3.5-3.5'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 16px center;
  padding-right: 40px;
}

.form-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.form-select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-select--error {
  border-color: #dc2626;
}

.form-select--error:focus {
  border-color: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.form-field--error {
  margin-bottom: 4px;
}

.field-error {
  font-size: var(--font-size-xs);
  color: #dc2626;
  margin-top: 2px;
}

.continue-btn {
  margin-top: 12px;
  padding: 14px 24px;
  background-color: var(--color-primary);
  border: none;
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.continue-btn:hover:not(:disabled) {
  background-color: var(--color-primary-dark);
}

.continue-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Address Type Grid */
.address-type-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 8px;
}

.address-type-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px 16px;
  background-color: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.2s ease;
}

.address-type-card:hover:not(:disabled) {
  border-color: var(--color-primary);
  background-color: var(--color-primary-bg);
}

.address-type-card--selected {
  border-color: var(--color-primary);
  background-color: var(--color-primary-bg);
}

.address-type-card:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.address-type-card__icon {
  font-size: 28px;
}

.address-type-card__label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
  text-align: center;
}

/* Address Summary */
.address-summary {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 16px;
  background-color: var(--color-primary-bg);
  border: 1px solid var(--color-primary-light);
  border-radius: var(--radius-lg);
  margin-bottom: 16px;
}

.address-summary__type {
  display: flex;
  align-items: center;
  gap: 8px;
}

.address-summary__icon {
  font-size: 18px;
}

.address-summary__label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-primary);
}

.address-summary__details {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.address-summary__detail {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
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
  padding: 32px 24px;
  text-align: center;
}

.steps-empty__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  background-color: var(--color-primary-bg, #eff6ff);
  border-radius: 50%;
  color: var(--color-primary, #155dfc);
  margin-bottom: 16px;
}

.steps-empty__title {
  margin: 0 0 8px;
  font-size: var(--font-size-lg, 18px);
  font-weight: var(--font-weight-semibold, 600);
  color: var(--color-text-primary, #101828);
}

.steps-empty__subtitle {
  margin: 0 0 20px;
  font-size: var(--font-size-sm, 14px);
  color: var(--color-text-secondary, #6a7282);
}

.steps-empty__examples {
  list-style: none;
  margin: 0;
  padding: 0;
  text-align: left;
  width: 100%;
  max-width: 280px;
}

.steps-empty__examples li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  font-size: var(--font-size-sm, 14px);
  color: var(--color-text-secondary, #6a7282);
}

.steps-empty__examples li svg {
  flex-shrink: 0;
  color: var(--color-text-muted, #99a1af);
}

.steps-empty__examples li span {
  line-height: 1.4;
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

.add-step-btn:hover:not(:disabled) {
  background-color: var(--color-background);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.add-step-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.danger-zone {
  padding-top: 8px;
}

.delete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 14px;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: #dc2626;
  cursor: pointer;
  transition: all 0.2s ease;
}

.delete-btn:hover:not(:disabled) {
  background-color: #fee2e2;
  border-color: #f87171;
}

.delete-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

.footer-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.footer-btn--secondary {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
}

.footer-btn--secondary:hover:not(:disabled) {
  background-color: var(--color-background);
  border-color: var(--color-secondary-dark);
}

.footer-btn--primary {
  background-color: var(--color-primary);
  border: none;
  color: white;
}

.footer-btn--primary:hover:not(:disabled) {
  background-color: var(--color-primary-dark);
}
</style>
