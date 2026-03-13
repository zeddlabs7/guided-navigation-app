<script setup lang="ts">
import { useRoute } from 'vue-router';
import { GCard } from '@guidenav/ui';

const route = useRoute();
const errorType = route.query.type as string | undefined;

const errorMessages: Record<string, { title: string; message: string }> = {
  EXPIRED: {
    title: 'Link Expired',
    message: 'This guidance link has expired. Please contact the sender for a new link.',
  },
  REVOKED: {
    title: 'Link Revoked',
    message: 'This guidance link has been revoked by the sender.',
  },
  NOT_FOUND: {
    title: 'Link Invalid',
    message: 'This guidance link is not valid. Please check the link and try again.',
  },
  default: {
    title: 'Something went wrong',
    message: 'We could not load the guidance. Please try again or contact the sender.',
  },
};

const error = errorMessages[errorType || 'default'] || errorMessages.default;
</script>

<template>
  <div class="error-page">
    <GCard padding="lg">
      <div class="error-content">
        <div class="error-icon">!</div>
        <h1 class="error-title">{{ error.title }}</h1>
        <p class="error-message">{{ error.message }}</p>
      </div>
    </GCard>
  </div>
</template>

<style scoped>
.error-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-md);
  background-color: var(--color-background);
}

.error-content {
  text-align: center;
  padding: var(--spacing-xl);
}

.error-icon {
  width: 5rem;
  height: 5rem;
  border-radius: 50%;
  background-color: var(--color-danger);
  color: white;
  font-size: 2.5rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--spacing-lg) auto;
}

.error-title {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  margin: 0 0 var(--spacing-md) 0;
  color: var(--color-danger);
}

.error-message {
  color: var(--color-text-muted);
  margin: 0;
  max-width: 280px;
}
</style>
