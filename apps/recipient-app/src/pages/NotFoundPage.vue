<script setup lang="ts">
import { useRouter } from 'vue-router';
import { GButton, GCard } from '@guidenav/ui';

const router = useRouter();

function handleGoHome() {
  router.push('/dashboard');
}
</script>

<template>
  <div class="not-found-page">
    <GCard padding="lg">
      <div class="not-found-content">
        <h1 class="not-found-title">404</h1>
        <p class="not-found-message">Page not found</p>
        <GButton variant="primary" @click="handleGoHome">
          Go to Dashboard
        </GButton>
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
}

.not-found-content {
  text-align: center;
  padding: var(--spacing-xl);
}

.not-found-title {
  font-size: 4rem;
  font-weight: 700;
  color: var(--color-primary);
  margin: 0;
}

.not-found-message {
  color: var(--color-text-muted);
  margin: var(--spacing-md) 0 var(--spacing-xl) 0;
}
</style>
