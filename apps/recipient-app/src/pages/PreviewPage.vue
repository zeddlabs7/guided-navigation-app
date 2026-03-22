<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { GSpinner } from '@guidenav/ui';
import type { GuidanceStep, GuidanceStatus } from '@guidenav/types';
import { getGuidanceSet, getGuidanceSteps, updateGuidanceSet } from '@guidenav/services';

const router = useRouter();
const route = useRoute();
const guidanceSetId = route.params.guidanceSetId as string;

const loading = ref(true);
const publishing = ref(false);
const error = ref<string | null>(null);
const guidanceTitle = ref('');
const guidanceStatus = ref<GuidanceStatus>('DRAFT');
const guidanceUpdatedAt = ref<string>('');
const steps = ref<GuidanceStep[]>([]);

const totalSteps = computed(() => steps.value.length);
const isPublished = computed(() => guidanceStatus.value === 'PUBLISHED');

const statusConfig: Record<GuidanceStatus, { bg: string; dot: string; text: string; label: string }> = {
  PUBLISHED: { bg: '#dcfce7', dot: '#22c55e', text: '#16a34a', label: 'Published' },
  DRAFT: { bg: '#fef3c7', dot: '#f59e0b', text: '#d97706', label: 'Draft' },
  DISABLED: { bg: '#f3f4f6', dot: '#99a1af', text: '#6a7282', label: 'Disabled' },
};

function formatDate(dateString: string): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
}

function getStepTypeLabel(stepType: string): string {
  const labels: Record<string, string> = {
    'GATE_ENTRY': 'Gate Entry',
    'ELEVATOR': 'Elevator',
    'PARKING': 'Parking',
    'RECEPTION': 'Reception',
    'STAIRS': 'Stairs',
    'HALLWAY': 'Hallway',
    'OTHER': 'Other',
  };
  return labels[stepType] || stepType;
}

function getOverlayCount(step: GuidanceStep): number {
  return step.overlays?.length || 0;
}

async function loadPreviewData() {
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
    
    guidanceTitle.value = guidanceSet.title;
    guidanceStatus.value = guidanceSet.status;
    guidanceUpdatedAt.value = guidanceSet.updatedAt || guidanceSet.createdAt || '';
    steps.value = guidanceSteps;
  } catch (err) {
    console.error('Failed to load preview data:', err);
    error.value = 'Failed to load preview data. Please try again.';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadPreviewData();
});

function handleBack() {
  router.push(`/guidance/${guidanceSetId}/edit`);
}

async function handlePublish() {
  publishing.value = true;
  error.value = null;
  
  try {
    await updateGuidanceSet(guidanceSetId, { status: 'PUBLISHED' });
    guidanceStatus.value = 'PUBLISHED';
  } catch (err) {
    console.error('Failed to publish guidance:', err);
    error.value = 'Failed to publish. Please try again.';
  } finally {
    publishing.value = false;
  }
}

async function handleUnpublish() {
  publishing.value = true;
  error.value = null;
  
  try {
    await updateGuidanceSet(guidanceSetId, { status: 'DRAFT' });
    guidanceStatus.value = 'DRAFT';
  } catch (err) {
    console.error('Failed to unpublish guidance:', err);
    error.value = 'Failed to unpublish. Please try again.';
  } finally {
    publishing.value = false;
  }
}

function handleShareLink() {
  const shareUrl = `${window.location.origin}/view/${guidanceSetId}`;
  navigator.clipboard.writeText(shareUrl);
  alert('Link copied to clipboard!');
}
</script>

<template>
  <div class="preview-page">
    <!-- Header -->
    <header class="preview-header">
      <button class="header-back-btn" @click="handleBack">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>Back</span>
      </button>
      
      <h1 class="header-title">Preview & Publish</h1>
      
      <span 
        v-if="!loading"
        class="status-badge"
        :style="{
          backgroundColor: statusConfig[guidanceStatus].bg,
          color: statusConfig[guidanceStatus].text,
        }"
      >
        <span 
          class="status-badge__dot"
          :style="{ backgroundColor: statusConfig[guidanceStatus].dot }"
        />
        {{ statusConfig[guidanceStatus].label }}
      </span>
    </header>
    
    <!-- Content -->
    <main class="preview-content">
      <div v-if="loading" class="loading-state">
        <GSpinner />
      </div>
      
      <template v-else-if="error && !guidanceTitle">
        <div class="error-state">
          <p class="error-state__title">Something went wrong</p>
          <p class="error-state__description">{{ error }}</p>
          <button class="error-state__retry" @click="loadPreviewData">
            Try Again
          </button>
        </div>
      </template>
      
      <template v-else>
        <!-- Summary Card -->
        <div class="summary-card">
          <div class="summary-card__icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="summary-card__content">
            <h2 class="summary-card__title">{{ guidanceTitle }}</h2>
            <p class="summary-card__description">Review your guidance before sharing with couriers.</p>
            <div class="summary-card__meta">
              <span>{{ totalSteps }} {{ totalSteps === 1 ? 'step' : 'steps' }}</span>
              <span class="meta-dot">•</span>
              <span>Modified {{ formatDate(guidanceUpdatedAt) }}</span>
            </div>
          </div>
        </div>
        
        <!-- Steps Section -->
        <div class="steps-section">
          <h3 class="steps-section__title">Steps ({{ totalSteps }})</h3>
          
          <div v-if="totalSteps === 0" class="steps-empty">
            <p>No steps added yet.</p>
            <button class="steps-empty__btn" @click="handleBack">
              Add Steps
            </button>
          </div>
          
          <div v-else class="steps-list">
            <div 
              v-for="(step, index) in steps" 
              :key="step.id"
              class="step-card"
            >
              <!-- Step Header -->
              <div class="step-card__header">
                <div class="step-number">{{ index + 1 }}</div>
                <div class="step-type-badge">
                  <span class="step-type-badge__dot" />
                  {{ getStepTypeLabel(step.stepType) }}
                </div>
                <div v-if="getOverlayCount(step) > 0" class="overlay-count">
                  <span class="overlay-count__dot" />
                  {{ getOverlayCount(step) }} {{ getOverlayCount(step) === 1 ? 'overlay' : 'overlays' }}
                </div>
              </div>
              
              <!-- Step Image -->
              <div class="step-card__image-container" v-if="step.image?.publicUrl">
                <img 
                  :src="step.image.publicUrl" 
                  :alt="step.title || 'Step image'"
                  class="step-card__image"
                />
                <div 
                  v-for="(overlay, idx) in step.overlays" 
                  :key="idx"
                  class="step-overlay"
                  :style="{
                    left: `${overlay.x}%`,
                    top: `${overlay.y}%`,
                    width: `${overlay.width}%`,
                    height: `${overlay.height}%`,
                  }"
                >
                  <span class="step-overlay__dot" />
                </div>
              </div>
              
              <!-- Step Content -->
              <div class="step-card__content">
                <h4 class="step-card__title">{{ step.title }}</h4>
                <p class="step-card__instructions">{{ step.instructionOriginal }}</p>
              </div>
            </div>
          </div>
        </div>
      </template>
    </main>
    
    <!-- Footer -->
    <footer v-if="!loading && totalSteps > 0" class="preview-footer">
      <template v-if="!isPublished">
        <button 
          class="footer-btn footer-btn--primary" 
          @click="handlePublish"
          :disabled="publishing"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          {{ publishing ? 'Publishing...' : 'Publish' }}
        </button>
        <button 
          class="footer-btn footer-btn--secondary" 
          disabled
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 6.65685 16.3431 8 18 8Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M6 15C7.65685 15 9 13.6569 9 12C9 10.3431 7.65685 9 6 9C4.34315 9 3 10.3431 3 12C3 13.6569 4.34315 15 6 15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M18 22C19.6569 22 21 20.6569 21 19C21 17.3431 19.6569 16 18 16C16.3431 16 15 17.3431 15 19C15 20.6569 16.3431 22 18 22Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M8.59 13.51L15.42 17.49M15.41 6.51L8.59 10.49" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Share Link
        </button>
      </template>
      
      <template v-else>
        <button 
          class="footer-btn footer-btn--outline" 
          @click="handleUnpublish"
          :disabled="publishing"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          {{ publishing ? 'Unpublishing...' : 'Unpublish' }}
        </button>
        <button 
          class="footer-btn footer-btn--secondary" 
          @click="handleShareLink"
          :disabled="publishing"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 6.65685 16.3431 8 18 8Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M6 15C7.65685 15 9 13.6569 9 12C9 10.3431 7.65685 9 6 9C4.34315 9 3 10.3431 3 12C3 13.6569 4.34315 15 6 15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M18 22C19.6569 22 21 20.6569 21 19C21 17.3431 19.6569 16 18 16C16.3431 16 15 17.3431 15 19C15 20.6569 16.3431 22 18 22Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M8.59 13.51L15.42 17.49M15.41 6.51L8.59 10.49" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Share Link
        </button>
      </template>
      
      <p v-if="!isPublished" class="footer-hint">
        Publish to generate a shareable link for couriers
      </p>
    </footer>
  </div>
</template>

<style scoped>
.preview-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--color-background);
}

/* Header */
.preview-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border-light);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.header-back-btn:hover {
  background-color: var(--color-surface);
  border-color: var(--color-secondary-dark);
  color: var(--color-text);
}

.header-title {
  flex: 1;
  margin: 0;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  text-align: center;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
}

.status-badge__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

/* Content */
.preview-content {
  flex: 1;
  padding: 16px;
  padding-bottom: 160px;
}

@media (min-width: 640px) {
  .preview-content {
    max-width: 400px;
    margin: 0 auto;
  }
}

.loading-state {
  display: flex;
  align-items: center;
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

.error-state__retry {
  padding: 12px 24px;
  background-color: var(--color-primary);
  border: none;
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: white;
  cursor: pointer;
}

/* Summary Card */
.summary-card {
  display: flex;
  gap: 16px;
  padding: 20px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-xl);
  margin-bottom: 24px;
}

.summary-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background-color: var(--color-primary);
  border-radius: var(--radius-lg);
  color: white;
  flex-shrink: 0;
}

.summary-card__content {
  flex: 1;
  min-width: 0;
}

.summary-card__title {
  margin: 0 0 4px;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  line-height: 1.3;
}

.summary-card__description {
  margin: 0 0 8px;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  line-height: 1.5;
}

.summary-card__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.meta-dot {
  color: var(--color-text-light);
}

/* Steps Section */
.steps-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.steps-section__title {
  margin: 0;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
}

.steps-empty {
  text-align: center;
  padding: 32px;
  background-color: var(--color-surface);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-lg);
}

.steps-empty__btn {
  margin-top: 12px;
  padding: 8px 16px;
  background-color: var(--color-primary);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: white;
  cursor: pointer;
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Step Card */
.step-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.step-card__header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border-light);
}

.step-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background-color: var(--color-primary);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: white;
}

.step-type-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background-color: #dcfce7;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: #16a34a;
}

.step-type-badge__dot {
  width: 6px;
  height: 6px;
  background-color: #22c55e;
  border-radius: 50%;
}

.overlay-count {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.overlay-count__dot {
  width: 6px;
  height: 6px;
  background-color: var(--color-primary);
  border-radius: 50%;
}

.step-card__image-container {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  background-color: var(--color-background);
}

.step-card__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.step-overlay {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-overlay__dot {
  width: 12px;
  height: 12px;
  background-color: var(--color-primary);
  border: 2px solid white;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.step-card__content {
  padding: 12px 16px 16px;
}

.step-card__title {
  margin: 0 0 4px;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
}

.step-card__instructions {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: 1.5;
}

/* Footer */
.preview-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 16px;
  background-color: var(--color-surface);
  border-top: 1px solid var(--color-border-light);
}

@media (min-width: 640px) {
  .preview-footer {
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
  padding: 14px 16px;
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

.footer-btn--primary {
  background-color: var(--color-primary);
  border: none;
  color: white;
}

.footer-btn--primary:hover:not(:disabled) {
  background-color: var(--color-primary-dark);
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

.footer-btn--outline {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
}

.footer-btn--outline:hover:not(:disabled) {
  background-color: var(--color-background);
}

.footer-hint {
  width: 100%;
  margin: 0;
  text-align: center;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
</style>
