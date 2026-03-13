<script setup lang="ts">
import { GCard } from '@guidenav/ui';
</script>

<template>
  <div class="not-found-page">
    <GCard padding="lg">
      <div class="not-found-content">
        <div class="not-found-icon">?</div>
        <h1 class="not-found-title">Page Not Found</h1>
        <p class="not-found-message">
          Please check your link and try again. The guidance link should look like:
          <code>example.com/g/your-token</code>
        </p>
      </div>
    </GCard>
  </div>
</template>

<style scoped>
.not-found-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-md);
  background-color: var(--color-background);
}

.not-found-content {
  text-align: center;
  padding: var(--spacing-xl);
}

.not-found-icon {
  width: 5rem;
  height: 5rem;
  border-radius: 50%;
  background-color: var(--color-text-muted);
  color: white;
  font-size: 2.5rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--spacing-lg) auto;
}

.not-found-title {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  margin: 0 0 var(--spacing-md) 0;
  color: var(--color-text);
}

.not-found-message {
  color: var(--color-text-muted);
  margin: 0;
  max-width: 300px;
  line-height: 1.5;
}

.not-found-message code {
  display: block;
  margin-top: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  background-color: var(--color-secondary);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
}
</style>
