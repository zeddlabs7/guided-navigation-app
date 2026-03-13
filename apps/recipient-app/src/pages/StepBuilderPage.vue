<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { GButton, GCard } from '@guidenav/ui';
import type { GuidanceStep } from '@guidenav/types';

const router = useRouter();
const route = useRoute();
const guidanceSetId = route.params.guidanceSetId as string;

const steps = ref<GuidanceStep[]>([]);
const loading = ref(false);

function handleBack() {
  router.push(`/guidance/${guidanceSetId}/edit`);
}

function handleAddStep() {
  // TODO: Implement add step
}
</script>

<template>
  <div class="page">
    <header class="page-header">
      <GButton variant="ghost" size="sm" @click="handleBack">
        ← Back
      </GButton>
      <h1 class="page-title">Steps</h1>
      <p class="page-subtitle">Add photos and instructions for each step</p>
    </header>

    <div v-if="steps.length === 0" class="empty-steps">
      <GCard padding="lg">
        <div class="empty-state">
          <p class="empty-state__title">No steps yet</p>
          <p class="empty-state__description">
            Add steps to guide couriers to your location
          </p>
          <GButton variant="primary" @click="handleAddStep">
            + Add First Step
          </GButton>
        </div>
      </GCard>
    </div>

    <div v-else class="steps-list">
      <GCard v-for="(step, index) in steps" :key="step.id" clickable>
        <div class="step-item">
          <span class="step-item__number">{{ index + 1 }}</span>
          <div class="step-item__content">
            <p class="step-item__type">{{ step.stepType }}</p>
            <p class="step-item__instruction">{{ step.instructionOriginal }}</p>
          </div>
        </div>
      </GCard>
    </div>

    <div v-if="steps.length > 0" class="add-step-action">
      <GButton variant="secondary" full-width @click="handleAddStep">
        + Add Step
      </GButton>
    </div>
  </div>
</template>

<style scoped>
.empty-steps {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-state {
  text-align: center;
  padding: var(--spacing-lg);
}

.empty-state__title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin: 0 0 var(--spacing-sm) 0;
}

.empty-state__description {
  color: var(--color-text-muted);
  margin: 0 0 var(--spacing-lg) 0;
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.step-item {
  display: flex;
  gap: var(--spacing-md);
  align-items: flex-start;
}

.step-item__number {
  width: 2rem;
  height: 2rem;
  border-radius: var(--radius-full);
  background-color: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  flex-shrink: 0;
}

.step-item__content {
  flex: 1;
}

.step-item__type {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin: 0;
}

.step-item__instruction {
  margin: var(--spacing-xs) 0 0 0;
}

.add-step-action {
  margin-top: var(--spacing-lg);
}
</style>
