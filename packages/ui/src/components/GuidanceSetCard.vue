<script setup lang="ts">
import type { GuidanceStatus, StepType, Overlay } from '@guidenav/types';
import StepThumbnail from './StepThumbnail.vue';

interface StepPreview {
  id: string;
  stepType: StepType;
  imageUrl: string | null;
  overlays?: Overlay[];
}

interface Props {
  id: string;
  title: string;
  titleArabic?: string;
  status: GuidanceStatus;
  stepCount: number;
  steps: StepPreview[];
  modifiedDate: string;
  expiresDate?: string;
  isLinkDisabled?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'edit': [id: string];
  'share': [id: string];
  'menu': [id: string];
}>();

const stepTypeColors: Record<StepType, { bg: string; dot: string; text: string }> = {
  PIN_CHECK: { bg: '#fffbeb', dot: '#ffb900', text: '#bb4d00' },
  APPROACH: { bg: '#f3f4f6', dot: '#99a1af', text: '#4a5565' },
  GATE_ENTRY: { bg: '#f0fdf4', dot: '#00c950', text: '#008236' },
  WALK_PATH: { bg: '#f3f4f6', dot: '#99a1af', text: '#4a5565' },
  TURN: { bg: '#f3f4f6', dot: '#99a1af', text: '#4a5565' },
  STAIRS: { bg: '#f3f4f6', dot: '#99a1af', text: '#4a5565' },
  ELEVATOR: { bg: '#faf5ff', dot: '#ad46ff', text: '#8200db' },
  LANDMARK: { bg: '#f3f4f6', dot: '#99a1af', text: '#4a5565' },
  DOOR_ENTRY: { bg: '#eff6ff', dot: '#155dfc', text: '#155dfc' },
  RECEPTION: { bg: '#f3f4f6', dot: '#99a1af', text: '#4a5565' },
  DROPOFF_POINT: { bg: '#f0fdf4', dot: '#00c950', text: '#008236' },
};

const stepTypeLabels: Record<StepType, string> = {
  PIN_CHECK: 'PIN Check',
  APPROACH: 'Approach',
  GATE_ENTRY: 'Gate Entry',
  WALK_PATH: 'Walk Path',
  TURN: 'Turn',
  STAIRS: 'Stairs',
  ELEVATOR: 'Elevator',
  LANDMARK: 'Landmark',
  DOOR_ENTRY: 'Door Entry',
  RECEPTION: 'Reception',
  DROPOFF_POINT: 'Drop-off',
};

const statusConfig: Record<GuidanceStatus, { bg: string; dot: string; text: string; label: string }> = {
  PUBLISHED: { bg: '#f0fdf4', dot: '#00c950', text: '#008236', label: 'Published' },
  DRAFT: { bg: '#fffbeb', dot: '#ffb900', text: '#bb4d00', label: 'Draft' },
  DISABLED: { bg: '#f3f4f6', dot: '#99a1af', text: '#6a7282', label: 'Disabled' },
};

const visibleSteps = props.steps.slice(0, 3);
const extraStepCount = props.steps.length > 3 ? props.steps.length - 3 : 0;
</script>

<template>
  <div class="guidance-card">
    <div class="guidance-card__images">
      <div 
        v-for="(step, index) in visibleSteps" 
        :key="step.id"
        class="guidance-card__image-container"
        :class="{ 'guidance-card__image-container--has-overlay': index === 2 && extraStepCount > 0 }"
      >
        <StepThumbnail
          :image-url="step.imageUrl"
          :overlays="step.overlays"
          fill-container
          :alt="stepTypeLabels[step.stepType]"
        />
        
        <div 
          v-if="index === 2 && extraStepCount > 0"
          class="guidance-card__image-overlay"
        >
          <span>+{{ extraStepCount }}</span>
        </div>
        
        <span 
          class="guidance-card__step-badge"
          :style="{
            backgroundColor: stepTypeColors[step.stepType].bg,
            color: stepTypeColors[step.stepType].text,
          }"
        >
          <span 
            class="guidance-card__step-badge-dot"
            :style="{ backgroundColor: stepTypeColors[step.stepType].dot }"
          />
          {{ stepTypeLabels[step.stepType] }}
        </span>
      </div>
      
      <span 
        class="guidance-card__status-badge"
        :style="{
          backgroundColor: statusConfig[status].bg,
          color: statusConfig[status].text,
        }"
      >
        <span 
          class="guidance-card__status-dot"
          :style="{ backgroundColor: statusConfig[status].dot }"
        />
        {{ statusConfig[status].label }}
      </span>
    </div>
    
    <div class="guidance-card__content">
      <h3 class="guidance-card__title">{{ title }}</h3>
      <p v-if="titleArabic" class="guidance-card__title-arabic" dir="rtl">{{ titleArabic }}</p>
      
      <div class="guidance-card__meta">
        <span class="guidance-card__meta-item guidance-card__meta-item--steps">
          {{ stepCount }} {{ stepCount === 1 ? 'step' : 'steps' }}
        </span>
        <span class="guidance-card__meta-separator">·</span>
        <span class="guidance-card__meta-item">Modified {{ modifiedDate }}</span>
      </div>
      
      <p v-if="expiresDate && status === 'PUBLISHED'" class="guidance-card__expires">
        Expires <span class="guidance-card__expires-date">{{ expiresDate }}</span>
      </p>
      
      <p v-if="isLinkDisabled" class="guidance-card__disabled-notice">
        Link disabled — not accessible to couriers.
      </p>
      
      <div class="guidance-card__actions">
        <button 
          v-if="status === 'PUBLISHED'"
          class="guidance-card__action-btn guidance-card__action-btn--share"
          @click="emit('share', id)"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 5.12548 15.0077 5.24917 15.0227 5.37061L8.08261 9.17972C7.54305 8.45917 6.6582 8 5.66667 8C4.19391 8 3 9.34315 3 11C3 12.6569 4.19391 14 5.66667 14C6.6582 14 7.54305 13.5408 8.08261 12.8203L15.0227 16.6294C15.0077 16.7508 15 16.8745 15 17C15 18.6569 16.3431 20 18 20C19.6569 20 21 18.6569 21 17C21 15.3431 19.6569 14 18 14C16.8053 14 15.7772 14.6842 15.2676 15.6706L8.32739 11.8612C8.4391 11.5943 8.5 11.3039 8.5 11C8.5 10.6961 8.4391 10.4057 8.32739 10.1388L15.2676 6.32943C15.7772 7.31584 16.8053 8 18 8Z" fill="currentColor"/>
          </svg>
          Share
        </button>
        
        <div class="guidance-card__action-right">
          <button 
            class="guidance-card__action-btn guidance-card__action-btn--delete"
            @click="emit('menu', id)"
            aria-label="Delete"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 6H5H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          
          <button 
            class="guidance-card__action-btn guidance-card__action-btn--edit"
            @click="emit('edit', id)"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Edit
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.guidance-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.guidance-card__images {
  display: flex;
  position: relative;
  height: 88px;
  overflow: hidden;
}

.guidance-card__image-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.guidance-card__image-overlay {
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
}

.guidance-card__step-badge {
  position: absolute;
  bottom: 4px;
  left: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  line-height: 1.5;
}

.guidance-card__step-badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.guidance-card__status-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  line-height: 1.5;
}

.guidance-card__status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.guidance-card__content {
  padding: 16px;
}

.guidance-card__title {
  margin: 0;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
  line-height: 1.5;
}

.guidance-card__title-arabic {
  margin: 4px 0 0;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-normal);
  color: var(--color-text-muted);
  font-family: var(--font-family-arabic);
  line-height: 1.4;
}

.guidance-card__meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
}

.guidance-card__meta-item {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.guidance-card__meta-item--steps {
  padding: 2px 8px;
  background-color: var(--color-background);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
}

.guidance-card__meta-separator {
  color: var(--color-text-light);
  font-size: var(--font-size-sm);
}

.guidance-card__expires {
  margin: 8px 0 0;
  font-size: var(--font-size-sm);
  color: #e17100;
}

.guidance-card__expires-date {
  font-weight: var(--font-weight-medium);
}

.guidance-card__disabled-notice {
  margin: 8px 0 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.guidance-card__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--color-background);
}

.guidance-card__action-right {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
}

.guidance-card__action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 32px;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all 0.2s ease;
}

.guidance-card__action-btn--share {
  padding: 0 12px;
  background-color: var(--color-primary-bg);
  color: var(--color-primary);
}

.guidance-card__action-btn--share:hover {
  background-color: #dbeafe;
}

.guidance-card__action-btn--delete {
  width: 32px;
  padding: 0;
  background-color: transparent;
  color: var(--color-text-muted);
}

.guidance-card__action-btn--delete:hover {
  background-color: #fef2f2;
  color: #dc2626;
}

.guidance-card__action-btn--edit {
  padding: 0 12px;
  background-color: var(--color-primary);
  color: white;
}

.guidance-card__action-btn--edit:hover {
  background-color: var(--color-primary-dark);
}
</style>
