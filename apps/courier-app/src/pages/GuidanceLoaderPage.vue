<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { GSpinner } from '@guidenav/ui';

const router = useRouter();
const route = useRoute();
const token = route.params.token as string;

const loading = ref(true);
const error = ref<string | null>(null);

onMounted(async () => {
  try {
    // TODO: Validate token and load guidance
    // For now, simulate loading and redirect to first step
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Redirect to first step
    router.replace(`/g/${token}/step/0`);
  } catch (err) {
    error.value = 'Failed to load address';
    router.replace(`/g/${token}/error`);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="loader-page">
    <div class="loader-content">
      <GSpinner size="lg" />
      <p class="loader-text">Loading address...</p>
    </div>
  </div>
</template>

<style scoped>
.loader-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-background);
}

.loader-content {
  text-align: center;
}

.loader-text {
  margin-top: var(--spacing-lg);
  color: var(--color-text-muted);
}
</style>
