<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import type { AddressType, MetadataFieldConfig, UnitType } from '@guidenav/types';
import { 
  ADDRESS_TYPE_LABELS, 
  ADDRESS_TYPE_STEP_CONFIG,
} from '@guidenav/types';
import { createGuidanceSet } from '@guidenav/services';
import { validateGuidanceTitle } from '@guidenav/core';
import { useAuth } from '../composables/useAuth';

const router = useRouter();
const { userId } = useAuth();

type FormStep = 'title' | 'addressType' | 'metadata' | 'steps';

const currentFormStep = ref<FormStep>('title');
const title = ref('');
const titleArabic = ref('');
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

const loading = ref(false);
const error = ref<string | null>(null);

const stepCount = ref(0);
const displayTitle = computed(() => title.value || 'Untitled Address');

const fieldErrors = ref<Record<string, string>>({});
const touchedFields = ref<Set<string>>(new Set());

watch(addressType, () => {
  Object.keys(metadataValues.value).forEach(key => {
    metadataValues.value[key] = '';
  });
  fieldErrors.value = {};
  touchedFields.value.clear();
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

function validateField(field: string): boolean {
  if (field === 'title') {
    const validation = validateGuidanceTitle(title.value);
    if (!validation.valid) {
      fieldErrors.value.title = validation.error || 'Title is required';
      return false;
    }
    delete fieldErrors.value.title;
    return true;
  }
  
  return validateMetadataField(field);
}

function handleFieldBlur(field: string) {
  touchedFields.value.add(field);
  validateField(field);
}

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

const canProceedFromMetadata = computed(() => {
  if (!requiresMetadata.value) return true;
  
  for (const fieldConfig of visibleFieldConfigs.value) {
    if (fieldConfig.required && !metadataValues.value[fieldConfig.field]?.trim()) {
      return false;
    }
  }
  return true;
});

const formStepTitle = computed(() => {
  switch (currentFormStep.value) {
    case 'title': return 'Address Details';
    case 'addressType': return 'Address Type';
    case 'metadata': return 'Building Details';
    case 'steps': return 'Steps';
    default: return 'New Address';
  }
});

function handleBack() {
  if (currentFormStep.value === 'addressType') {
    currentFormStep.value = 'title';
  } else if (currentFormStep.value === 'metadata') {
    currentFormStep.value = 'addressType';
  } else if (currentFormStep.value === 'steps') {
    currentFormStep.value = requiresMetadata.value ? 'metadata' : 'addressType';
  } else {
    router.push('/dashboard');
  }
}

function handleGoToDashboard() {
  router.push('/dashboard');
}

function handleContinueFromTitle() {
  touchedFields.value.add('title');
  if (!validateField('title')) {
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
  if (!userId.value) {
    error.value = 'Not authenticated';
    return;
  }
  
  if (!addressType.value) {
    error.value = 'Please select an address type';
    return;
  }
  
  const validation = validateGuidanceTitle(title.value);
  if (!validation.valid) {
    error.value = validation.error || 'Please enter a valid title';
    return;
  }
  
  if (requiresMetadata.value && !canProceedFromMetadata.value) {
    error.value = 'Please fill in all required details';
    return;
  }
  
  loading.value = true;
  error.value = null;
  
  try {
    const guidanceSetId = await createGuidanceSet(userId.value, {
      title: title.value.trim(),
      description: null,
      languageOriginal: 'en',
      availabilityMode: 'ANYTIME_TODAY',
      destinationCoordinates: null,
      addressType: addressType.value,
      ...(requiresMetadata.value && buildMetadataPayload()),
    });
    
    router.push(`/guidance/${guidanceSetId}/edit`);
  } catch (err) {
    console.error('Failed to create guidance set:', err);
    error.value = 'Failed to save. Please try again.';
  } finally {
    loading.value = false;
  }
}

async function handlePreviewAndPublish() {
  if (!userId.value) {
    error.value = 'Not authenticated';
    return;
  }
  
  if (!addressType.value) {
    error.value = 'Please select an address type';
    return;
  }
  
  const validation = validateGuidanceTitle(title.value);
  if (!validation.valid) {
    error.value = validation.error || 'Please enter a valid title';
    return;
  }
  
  if (requiresMetadata.value && !canProceedFromMetadata.value) {
    error.value = 'Please fill in all required details';
    return;
  }
  
  loading.value = true;
  error.value = null;
  
  try {
    const guidanceSetId = await createGuidanceSet(userId.value, {
      title: title.value.trim(),
      description: null,
      languageOriginal: 'en',
      availabilityMode: 'ANYTIME_TODAY',
      destinationCoordinates: null,
      addressType: addressType.value,
      ...(requiresMetadata.value && buildMetadataPayload()),
    });
    
    router.push(`/guidance/${guidanceSetId}/preview`);
  } catch (err) {
    console.error('Failed to create address set:', err);
    error.value = 'Failed to save. Please try again.';
  } finally {
    loading.value = false;
  }
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

async function handleAddStep() {
  if (!userId.value) {
    error.value = 'Not authenticated';
    return;
  }
  
  if (!addressType.value) {
    error.value = 'Please select an address type first';
    return;
  }
  
  const validation = validateGuidanceTitle(title.value);
  if (!validation.valid) {
    error.value = validation.error || 'Please enter a title first';
    return;
  }
  
  if (requiresMetadata.value && !canProceedFromMetadata.value) {
    error.value = 'Please fill in all required details first';
    return;
  }
  
  loading.value = true;
  error.value = null;
  
  try {
    const guidanceSetId = await createGuidanceSet(userId.value, {
      title: title.value.trim(),
      description: null,
      languageOriginal: 'en',
      availabilityMode: 'ANYTIME_TODAY',
      destinationCoordinates: null,
      addressType: addressType.value,
      ...(requiresMetadata.value && buildMetadataPayload()),
    });
    
    router.push(`/guidance/${guidanceSetId}/steps?stepIndex=0&addressType=${addressType.value}`);
  } catch (err) {
    console.error('Failed to create address set:', err);
    error.value = 'Failed to save. Please try again.';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="create-page">
    <header class="create-header">
      <div class="create-header__nav">
        <button class="create-header__back" @click="handleBack" aria-label="Go back" title="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <button class="create-header__dashboard" @click="handleGoToDashboard" aria-label="Go to dashboard" title="Dashboard">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M9 22V12H15V22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
      
      <div class="create-header__info">
        <span class="create-header__label">New Address</span>
        <span class="create-header__title">{{ displayTitle }}</span>
      </div>
      
      <button 
        v-if="currentFormStep === 'steps'"
        class="create-header__save-btn" 
        @click="handleSaveDraft"
        :disabled="loading"
      >
        {{ loading ? 'Saving...' : 'Save Draft' }}
      </button>
    </header>
    
    <main class="create-content">
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
        <div class="progress-step" :class="{ 'progress-step--active': currentFormStep === 'title', 'progress-step--completed': currentFormStep !== 'title' }">
          <span class="progress-step__number">1</span>
          <span class="progress-step__label">Title</span>
        </div>
        <div class="progress-step__line" :class="{ 'progress-step__line--completed': currentFormStep !== 'title' }" />
        <div class="progress-step" :class="{ 'progress-step--active': currentFormStep === 'addressType', 'progress-step--completed': currentFormStep === 'metadata' || currentFormStep === 'steps' }">
          <span class="progress-step__number">2</span>
          <span class="progress-step__label">Type</span>
        </div>
        <template v-if="requiresMetadata">
          <div class="progress-step__line" :class="{ 'progress-step__line--completed': currentFormStep === 'metadata' || currentFormStep === 'steps' }" />
          <div class="progress-step" :class="{ 'progress-step--active': currentFormStep === 'metadata', 'progress-step--completed': currentFormStep === 'steps' }">
            <span class="progress-step__number">3</span>
            <span class="progress-step__label">Details</span>
          </div>
        </template>
        <div class="progress-step__line" :class="{ 'progress-step__line--completed': currentFormStep === 'steps' }" />
        <div class="progress-step" :class="{ 'progress-step--active': currentFormStep === 'steps' }">
          <span class="progress-step__number">{{ requiresMetadata ? '4' : '3' }}</span>
          <span class="progress-step__label">Steps</span>
        </div>
      </div>
      
      <!-- Step 1: Title -->
      <div v-if="currentFormStep === 'title'" class="form-section">
        <h2 class="section-title">{{ formStepTitle }}</h2>
        <div class="form-field" :class="{ 'form-field--error': fieldErrors.title && touchedFields.has('title') }">
          <label class="form-label">Address Title <span class="required-star">*</span></label>
          <input 
            v-model="title"
            type="text"
            class="form-input"
            :class="{ 'form-input--error': fieldErrors.title && touchedFields.has('title') }"
            placeholder="e.g. Al Nakheel Tower – Delivery Guide"
            :disabled="loading"
            @blur="handleFieldBlur('title')"
          />
          <span v-if="fieldErrors.title && touchedFields.has('title')" class="field-error">
            {{ fieldErrors.title }}
          </span>
        </div>
        
        <div class="form-field">
          <label class="form-label form-label--optional">Arabic Title (optional)</label>
          <input 
            v-model="titleArabic"
            type="text"
            class="form-input"
            dir="rtl"
            placeholder="عنوان عربي اختياري"
            :disabled="loading"
          />
        </div>
        
        <button 
          class="continue-btn" 
          @click="handleContinueFromTitle"
          :disabled="loading"
        >
          Continue
        </button>
      </div>
      
      <!-- Step 2: Address Type -->
      <div v-else-if="currentFormStep === 'addressType'" class="form-section">
        <h2 class="section-title">{{ formStepTitle }}</h2>
        <p class="section-subtitle">What type of address is this?</p>
        
        <div class="address-type-grid">
          <button
            v-for="option in addressTypeOptions"
            :key="option.type"
            class="address-type-card"
            :class="{ 'address-type-card--selected': addressType === option.type }"
            @click="handleSelectAddressType(option.type)"
            :disabled="loading"
          >
            <span class="address-type-card__icon">{{ option.icon }}</span>
            <span class="address-type-card__label">{{ option.label }}</span>
          </button>
        </div>
        
        <button 
          class="continue-btn" 
          @click="handleContinueFromAddressType"
          :disabled="loading || !addressType"
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
              :disabled="loading"
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
              :disabled="loading"
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
          :disabled="loading"
        >
          Continue to Steps
        </button>
      </div>
      
      <!-- Step 3/4: Steps -->
      <div v-else-if="currentFormStep === 'steps'" class="steps-section">
        <!-- Address Summary -->
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
        
        <div class="steps-empty">
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
        
        <button class="add-step-btn" @click="handleAddStep" :disabled="loading">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Add First Step
        </button>
      </div>
    </main>
    
    <footer v-if="currentFormStep === 'steps'" class="create-footer">
      <button 
        class="footer-btn footer-btn--secondary" 
        @click="handleSaveDraft"
        :disabled="loading"
      >
        {{ loading ? 'Saving...' : 'Save Draft' }}
      </button>
      <button 
        class="footer-btn footer-btn--primary" 
        @click="handlePreviewAndPublish"
        :disabled="loading"
      >
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

.create-header__nav {
  display: flex;
  align-items: center;
  gap: 4px;
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

.create-header__dashboard {
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

.create-header__dashboard:hover {
  background-color: var(--color-background);
  color: var(--color-primary);
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

.create-header__save-btn:hover:not(:disabled) {
  background-color: var(--color-background);
  border-color: var(--color-secondary-dark);
}

.create-header__save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
  width: 40px;
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

.form-field--error {
  margin-bottom: 4px;
}

.field-error {
  font-size: var(--font-size-xs);
  color: #dc2626;
  margin-top: 2px;
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
