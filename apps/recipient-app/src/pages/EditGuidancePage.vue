<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { StepCard, GSpinner } from '@guidenav/ui';
import type { GuidanceStatus, StepType, GuidanceStep } from '@guidenav/types';
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

const title = ref('');
const titleArabic = ref('');
const status = ref<GuidanceStatus>('DRAFT');
const loading = ref(true);
const saving = ref(false);
const error = ref<string | null>(null);

interface StepData {
  id: string;
  stepType: StepType;
  title: string;
  instructions: string;
  imageUrl: string | null;
  overlayCount: number;
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
      error.value = 'Guidance set not found';
      return;
    }
    
    title.value = guidanceSet.title;
    status.value = guidanceSet.status;
    originalSteps.value = guidanceSteps;
    
    steps.value = guidanceSteps.map(step => ({
      id: step.id,
      stepType: step.stepType,
      title: step.title || '',
      instructions: step.instructionOriginal,
      imageUrl: step.image?.publicUrl || null,
      overlayCount: step.overlays?.length || 0,
    }));
  } catch (err) {
    console.error('Failed to load guidance set:', err);
    error.value = 'Failed to load guidance set. Please try again.';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadGuidanceSet();
});

const stepCount = computed(() => steps.value.length);

const statusConfig: Record<GuidanceStatus, { bg: string; dot: string; text: string; label: string }> = {
  PUBLISHED: { bg: '#f0fdf4', dot: '#00c950', text: '#008236', label: 'Published' },
  DRAFT: { bg: '#fffbeb', dot: '#ffb900', text: '#bb4d00', label: 'Draft' },
  DISABLED: { bg: '#f3f4f6', dot: '#99a1af', text: '#6a7282', label: 'Disabled' },
};

function handleBack() {
  router.push('/dashboard');
}

async function handleSaveDraft() {
  if (!title.value.trim()) {
    error.value = 'Title is required';
    return;
  }
  
  saving.value = true;
  error.value = null;
  
  try {
    await updateGuidanceSet(guidanceSetId, {
      title: title.value.trim(),
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
  router.push(`/guidance/${guidanceSetId}/steps`);
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
  router.push(`/guidance/${guidanceSetId}/steps?edit=${stepId}`);
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
        class="edit-header__save-btn" 
        @click="handleSaveDraft"
        :disabled="saving || loading"
      >
        {{ saving ? 'Saving...' : 'Save Draft' }}
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
          <button class="error-state__back" @click="handleBack">
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
        
        <div class="form-section">
          <div class="form-field">
            <label class="form-label">Guidance Title</label>
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
          
          <button class="add-step-btn" @click="handleAddStep" :disabled="saving">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Add Step
          </button>
        </div>
        
        <div class="divider" />
        
        <div class="danger-zone">
          <button class="delete-btn" @click="handleDeleteGuidance" :disabled="saving">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 6H5H21M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Delete Guidance
          </button>
        </div>
      </template>
    </main>
    
    <footer v-if="!loading && title" class="edit-footer">
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

.edit-header__save-btn:hover:not(:disabled) {
  background-color: var(--color-background);
  border-color: var(--color-secondary-dark);
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

.form-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
