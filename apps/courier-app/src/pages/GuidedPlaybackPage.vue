<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { GButton, GCard, GBadge, GModal } from '@guidenav/ui';

const router = useRouter();
const route = useRoute();
const token = route.params.token as string;
const currentIndex = parseInt(route.params.index as string, 10);

const totalSteps = ref(5);
const showFeedbackModal = ref(false);
const availability = ref('Anytime Today');

const isFirstStep = computed(() => currentIndex === 0);
const isLastStep = computed(() => currentIndex === totalSteps.value - 1);

function handlePrevious() {
  if (!isFirstStep.value) {
    router.push(`/g/${token}/step/${currentIndex - 1}`);
  }
}

function handleNext() {
  if (isLastStep.value) {
    router.push(`/g/${token}/complete`);
  } else {
    router.push(`/g/${token}/step/${currentIndex + 1}`);
  }
}

function handleCantFind() {
  showFeedbackModal.value = true;
}

function handleSubmitFeedback(reason: string) {
  // TODO: Submit feedback
  console.log('Feedback:', reason);
  showFeedbackModal.value = false;
}

function handleOpenMaps() {
  // TODO: Open maps with coordinates
  window.open('https://maps.google.com', '_blank');
}
</script>

<template>
  <div class="courier-page">
    <header class="courier-header">
      <div class="header-content">
        <div class="step-counter">
          Step {{ currentIndex + 1 }} of {{ totalSteps }}
        </div>
        <GBadge variant="success">{{ availability }}</GBadge>
      </div>
    </header>

    <main class="courier-content">
      <div class="step-image-container">
        <div class="step-image-placeholder">
          <span>Step Image</span>
          <span class="placeholder-hint">Photo will appear here</span>
        </div>
      </div>

      <div class="step-info">
        <GCard padding="md">
          <p class="step-instruction">
            Follow this path and turn right at the blue gate
          </p>
        </GCard>
      </div>
    </main>

    <footer class="courier-footer">
      <div class="footer-actions">
        <GButton
          variant="secondary"
          :disabled="isFirstStep"
          @click="handlePrevious"
        >
          Back
        </GButton>

        <GButton variant="ghost" size="sm" @click="handleCantFind">
          Can't find this?
        </GButton>

        <GButton variant="primary" @click="handleNext">
          {{ isLastStep ? 'Complete' : 'Next' }}
        </GButton>
      </div>

      <div class="footer-maps">
        <GButton variant="ghost" full-width @click="handleOpenMaps">
          📍 Open in Maps
        </GButton>
      </div>
    </footer>

    <GModal
      :open="showFeedbackModal"
      title="Can't find this step?"
      @close="showFeedbackModal = false"
    >
      <div class="feedback-options">
        <GButton
          variant="secondary"
          full-width
          @click="handleSubmitFeedback('WRONG_PHOTO')"
        >
          Wrong photo
        </GButton>
        <GButton
          variant="secondary"
          full-width
          @click="handleSubmitFeedback('UNCLEAR_DIRECTION')"
        >
          Unclear direction
        </GButton>
        <GButton
          variant="secondary"
          full-width
          @click="handleSubmitFeedback('MISSING_STEP')"
        >
          Missing step
        </GButton>
        <GButton
          variant="secondary"
          full-width
          @click="handleSubmitFeedback('LOCATION_CONFUSING')"
        >
          Location is confusing
        </GButton>
        <GButton
          variant="secondary"
          full-width
          @click="handleSubmitFeedback('OTHER')"
        >
          Other
        </GButton>
      </div>
    </GModal>
  </div>
</template>

<style scoped>
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.step-counter {
  font-weight: 600;
}

.step-image-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #1f2937;
  min-height: 300px;
}

.step-image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  color: #9ca3af;
}

.placeholder-hint {
  font-size: var(--font-size-sm);
}

.step-info {
  padding: var(--spacing-md);
}

.step-instruction {
  margin: 0;
  font-size: var(--font-size-lg);
  line-height: 1.5;
}

.footer-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.footer-maps {
  border-top: 1px solid var(--color-border);
  padding-top: var(--spacing-md);
}

.feedback-options {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}
</style>
