<script setup lang="ts">
import { computed } from 'vue';
import { STEP_TYPE_LABELS, type GuidanceStep } from '@guidenav/types';

interface Props {
  steps: GuidanceStep[];
  isRtl: boolean;
  onSelectStep: (index: number) => void;
  onScrollPrev: () => void;
}

const props = defineProps<Props>();

interface StepRow {
  step: GuidanceStep;
  index: number;
  number: number;
  typeLabel: string;
  displayTitle: string;
  instruction: string;
  thumbnail: string | null;
}

const rows = computed<StepRow[]>(() =>
  props.steps.map((step, i) => {
    const labels = STEP_TYPE_LABELS[step.stepType];
    const typeLabel = props.isRtl ? labels.ar : labels.en;
    const instruction = props.isRtl && step.instructionTranslations?.ar
      ? step.instructionTranslations.ar
      : step.instructionOriginal;
    return {
      step,
      index: i,
      number: i + 1,
      typeLabel,
      displayTitle: step.title?.trim() || typeLabel,
      instruction: instruction || '',
      thumbnail: step.image?.publicUrl ?? null,
    };
  })
);
</script>

<template>
  <section class="steps-section" :id="'landing-section-3'">
    <header class="section-header">
      <span class="section-kicker">{{ isRtl ? 'الدليل' : 'Guide' }}</span>
      <h2 class="section-title">{{ isRtl ? 'خطوات التوصيل' : 'Delivery steps' }}</h2>
      <p class="section-subtitle">
        {{ isRtl ? 'اضغط على خطوة لعرض التعليمات التفصيلية' : 'Tap a step to view detailed instructions' }}
      </p>
    </header>

    <div v-if="rows.length === 0" class="empty-state">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.6"/>
        <path d="M8 12h8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
      </svg>
      <span>{{ isRtl ? 'لا توجد خطوات إضافية' : 'No additional steps' }}</span>
    </div>

    <ol v-else class="step-list">
      <li v-for="row in rows" :key="row.step.id" class="step-row">
        <button
          type="button"
          class="step-card"
          @click="props.onSelectStep(row.index)"
          :aria-label="`${row.typeLabel}: ${row.displayTitle}`"
        >
          <div class="step-thumbnail" :class="{ 'step-thumbnail--placeholder': !row.thumbnail }">
            <img v-if="row.thumbnail" :src="row.thumbnail" :alt="row.displayTitle" />
            <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.8"/>
              <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
              <path d="M21 15l-5-5L5 21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="step-number">{{ row.number }}</span>
          </div>

          <div class="step-body">
            <span class="step-type">{{ row.typeLabel }}</span>
            <span class="step-title">{{ row.displayTitle }}</span>
            <span v-if="row.instruction" class="step-instruction">{{ row.instruction }}</span>
          </div>

          <span class="step-chevron" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
        </button>
      </li>
    </ol>

    <div class="section-footer">
      <button class="scroll-pill" type="button" @click="props.onScrollPrev">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 15l-6-6-6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>{{ isRtl ? 'العودة للخريطة' : 'Back to map' }}</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.steps-section {
  min-height: 100%;
  scroll-snap-align: start;
  scroll-snap-stop: always;
  display: flex;
  flex-direction: column;
  background-color: var(--color-background);
  padding: calc(env(safe-area-inset-top) + var(--spacing-md)) var(--spacing-md)
    calc(env(safe-area-inset-bottom) + var(--spacing-md));
  gap: var(--spacing-md);
}

.section-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 var(--spacing-xs);
}

.section-kicker {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-primary);
}

.section-title {
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
}

.section-subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin: 0;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  color: var(--color-text-muted);
  font-size: var(--font-size-base);
}

.step-list {
  flex: 1;
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.step-row {
  display: block;
}

.step-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  width: 100%;
  padding: 12px;
  background-color: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  text-align: start;
  cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.12s ease, border-color 0.12s ease;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.step-card:hover {
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.08);
  border-color: var(--color-primary-light);
}

.step-card:active {
  transform: scale(0.99);
}

.step-thumbnail {
  position: relative;
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  border-radius: var(--radius-md);
  overflow: hidden;
  background-color: var(--color-primary-light);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.step-thumbnail--placeholder {
  background-color: var(--color-background);
  color: var(--color-text-muted);
}

.step-number {
  position: absolute;
  top: 4px;
  left: 4px;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: var(--radius-full);
  background-color: var(--color-primary);
  color: white;
  font-size: 11px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(15, 23, 42, 0.25);
}

[dir="rtl"] .step-number {
  left: auto;
  right: 4px;
}

.step-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.step-type {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-primary);
}

.step-title {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.step-instruction {
  font-size: 13px;
  color: var(--color-text-muted);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.step-chevron {
  flex-shrink: 0;
  color: var(--color-text-muted);
}

[dir="rtl"] .step-chevron svg {
  transform: scaleX(-1);
}

.section-footer {
  display: flex;
  justify-content: center;
}

.scroll-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 40px;
  padding: 0 16px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border);
  background-color: white;
  color: var(--color-text-muted);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

[dir="rtl"] .scroll-pill svg {
  transform: scaleX(-1);
}
</style>
