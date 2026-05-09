<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { GSpinner } from '@guidenav/ui';
import { loadGuidanceByToken } from '@guidenav/services';
import { useCourierSession } from '@/composables/useCourierSession';

const router = useRouter();
const route = useRoute();
const token = route.params.token as string;

const { setSession, setLoading, setError, setToken, setRecipientPhoneNumber } = useCourierSession();

onMounted(async () => {
  setLoading(true);
  setToken(token);

  try {
    const result = await loadGuidanceByToken(token);

    if (!result.valid || !result.shareLink || !result.guidanceSet || !result.steps) {
      const errorType = result.error || 'NOT_FOUND';
      router.replace(`/g/${token}/error?type=${errorType}`);
      return;
    }

    if (result.recipientPhoneNumber) {
      setRecipientPhoneNumber(result.recipientPhoneNumber);
    }

    setSession(result.shareLink, result.guidanceSet, result.steps);

    router.replace(`/g/${token}/landing`);
  } catch (err) {
    console.error('Failed to load guidance:', err);
    setError('Failed to load guidance');
    router.replace(`/g/${token}/error?type=LOAD_FAILED`);
  } finally {
    setLoading(false);
  }
});
</script>

<template>
  <div class="loader-page">
    <div class="loader-content">
      <GSpinner size="lg" />
      <p class="loader-text">Loading Arriveo...</p>
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
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.loader-text {
  margin-top: var(--spacing-lg);
  color: var(--color-text-muted);
  font-size: var(--font-size-base);
}
</style>
