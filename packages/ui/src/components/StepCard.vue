<script setup lang="ts">
import type { StepType } from '@guidenav/types';

interface Props {
  stepNumber: number;
  stepType: StepType;
  title: string;
  instructions: string;
  imageUrl: string | null;
  overlayCount?: number;
  isFirst?: boolean;
  isLast?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'move-up': [];
  'move-down': [];
  'edit': [];
  'delete': [];
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
  APPROACH: 'Parking',
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

const colors = stepTypeColors[props.stepType] || stepTypeColors.APPROACH;
const label = stepTypeLabels[props.stepType] || props.stepType;
</script>

<template>
  <div class="step-card">
    <div class="step-card__header">
      <div class="step-card__drag-handle">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="9" cy="6" r="1.5" fill="currentColor"/>
          <circle cx="15" cy="6" r="1.5" fill="currentColor"/>
          <circle cx="9" cy="12" r="1.5" fill="currentColor"/>
          <circle cx="15" cy="12" r="1.5" fill="currentColor"/>
          <circle cx="9" cy="18" r="1.5" fill="currentColor"/>
          <circle cx="15" cy="18" r="1.5" fill="currentColor"/>
        </svg>
      </div>
      
      <div class="step-card__number">{{ stepNumber }}</div>
      
      <span 
        class="step-card__type-badge"
        :style="{
          backgroundColor: colors.bg,
          color: colors.text,
        }"
      >
        <span 
          class="step-card__type-dot"
          :style="{ backgroundColor: colors.dot }"
        />
        {{ label }}
      </span>
      
      <div class="step-card__spacer" />
      
      <div class="step-card__actions">
        <button 
          class="step-card__action-btn"
          :class="{ 'step-card__action-btn--disabled': isFirst }"
          :disabled="isFirst"
          @click="emit('move-up')"
          aria-label="Move up"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 19V5M12 5L5 12M12 5L19 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        
        <button 
          class="step-card__action-btn"
          :class="{ 'step-card__action-btn--disabled': isLast }"
          :disabled="isLast"
          @click="emit('move-down')"
          aria-label="Move down"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5V19M12 19L19 12M12 19L5 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        
        <div class="step-card__action-divider" />
        
        <button 
          class="step-card__action-btn"
          @click="emit('edit')"
          aria-label="Edit step"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        
        <button 
          class="step-card__action-btn"
          @click="emit('delete')"
          aria-label="Delete step"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 6H5H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
    
    <div class="step-card__content">
      <div class="step-card__image-container">
        <img 
          v-if="imageUrl"
          :src="imageUrl" 
          :alt="title"
          class="step-card__image"
        />
        <div v-else class="step-card__image-placeholder" />
      </div>
      
      <div class="step-card__details">
        <p class="step-card__title">{{ title }}</p>
        <p class="step-card__instructions">{{ instructions }}</p>
        <div v-if="overlayCount && overlayCount > 0" class="step-card__overlay-count">
          <span class="step-card__overlay-badge">{{ overlayCount }}</span>
          <span class="step-card__overlay-label">overlay{{ overlayCount > 1 ? 's' : '' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.step-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.step-card__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px;
}

.step-card__drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  cursor: grab;
}

.step-card__number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background-color: var(--color-primary);
  color: white;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  border-radius: var(--radius-full);
}

.step-card__type-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  line-height: 1.5;
}

.step-card__type-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.step-card__spacer {
  flex: 1;
}

.step-card__actions {
  display: flex;
  align-items: center;
  gap: 2px;
}

.step-card__action-btn {
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

.step-card__action-btn:hover:not(:disabled) {
  background-color: var(--color-background);
  color: var(--color-text);
}

.step-card__action-btn--disabled,
.step-card__action-btn:disabled {
  opacity: 0.25;
  cursor: not-allowed;
}

.step-card__action-divider {
  width: 1px;
  height: 16px;
  background-color: var(--color-border-light);
  margin: 0 4px;
}

.step-card__content {
  display: flex;
  gap: 12px;
  padding: 0 14px 14px 54px;
}

.step-card__image-container {
  flex-shrink: 0;
  width: 64px;
  height: 64px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  border: 1px solid var(--color-border-light);
}

.step-card__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.step-card__image-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--color-border-light) 0%, var(--color-border) 100%);
}

.step-card__details {
  flex: 1;
  min-width: 0;
}

.step-card__title {
  margin: 0;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
  line-height: 1.4;
}

.step-card__instructions {
  margin: 4px 0 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.step-card__overlay-count {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
}

.step-card__overlay-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  background-color: var(--color-background);
  border-radius: var(--radius-full);
  font-size: 10px;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
}

.step-card__overlay-label {
  font-size: var(--font-size-sm);
  color: var(--color-warning);
}
</style>
