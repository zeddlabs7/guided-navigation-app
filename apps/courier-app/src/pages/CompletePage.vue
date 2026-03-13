<script setup lang="ts">
import { GCard } from '@guidenav/ui';
</script>

<template>
  <div class="complete-page">
    <GCard padding="lg">
      <div class="complete-content">
        <div class="complete-icon">✓</div>
        <h1 class="complete-title">Delivery Complete!</h1>
        <p class="complete-message">
          You've reached the drop-off point. Thank you for using Delivery Guidance.
        </p>
      </div>
    </GCard>
  </div>
</template>

<style scoped>
.complete-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-md);
  background-color: var(--color-background);
}

.complete-content {
  text-align: center;
  padding: var(--spacing-xl);
}

.complete-icon {
  width: 5rem;
  height: 5rem;
  border-radius: 50%;
  background-color: var(--color-success);
  color: white;
  font-size: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--spacing-lg) auto;
}

.complete-title {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  margin: 0 0 var(--spacing-md) 0;
  color: var(--color-success);
}

.complete-message {
  color: var(--color-text-muted);
  margin: 0;
  max-width: 280px;
}
</style>
