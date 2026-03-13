<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { GButton, GCard } from '@guidenav/ui';

const router = useRouter();
const route = useRoute();
const guidanceSetId = route.params.guidanceSetId as string;

const currentStep = ref(0);
const totalSteps = ref(0);

function handleBack() {
  router.push(`/guidance/${guidanceSetId}/edit`);
}

function handlePrevious() {
  if (currentStep.value > 0) {
    currentStep.value--;
  }
}

function handleNext() {
  if (currentStep.value < totalSteps.value - 1) {
    currentStep.value++;
  }
}
</script>

<template>
  <div class="page preview-page">
    <header class="preview-header">
      <GButton variant="ghost" size="sm" @click="handleBack">
        ← Exit Preview
      </GButton>
    </header>

    <div class="preview-content">
      <GCard padding="lg">
        <div class="preview-empty">
          <p>No steps to preview</p>
          <p class="preview-empty__hint">Add steps first to preview the guidance</p>
        </div>
      </GCard>
    </div>

    <footer v-if="totalSteps > 0" class="preview-footer">
      <GButton
        variant="secondary"
        :disabled="currentStep === 0"
        @click="handlePrevious"
      >
        Back
      </GButton>
      <span class="preview-counter">
        {{ currentStep + 1 }} / {{ totalSteps }}
      </span>
      <GButton
        variant="primary"
        :disabled="currentStep === totalSteps - 1"
        @click="handleNext"
      >
        Next
      </GButton>
    </footer>
  </div>
</template>

<style scoped>
.preview-page {
  padding: 0;
}

.preview-header {
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
}

.preview-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-md);
}

.preview-empty {
  text-align: center;
  color: var(--color-text-muted);
}

.preview-empty__hint {
  font-size: var(--font-size-sm);
  margin-top: var(--spacing-sm);
}

.preview-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md);
  border-top: 1px solid var(--color-border);
  background-color: var(--color-surface);
}

.preview-counter {
  font-weight: 600;
}
</style>
