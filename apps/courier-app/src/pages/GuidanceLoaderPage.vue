<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { GSpinner } from '@guidenav/ui';
import {
  validateShareLinkToken,
  getGuidanceSet,
  getGuidanceSteps,
  incrementAccessCount,
  getUser,
} from '@guidenav/services';
import { useCourierSession } from '@/composables/useCourierSession';

const router = useRouter();
const route = useRoute();
const token = route.params.token as string;

const { setSession, setLoading, setError, setToken, setRecipientPhoneNumber } = useCourierSession();

async function fetchAndStoreRecipientPhone(recipientUserId: string) {
  try {
    const user = await getUser(recipientUserId);
    if (user?.phoneNumber) {
      setRecipientPhoneNumber(user.phoneNumber);
    }
  } catch (err) {
    console.error('Failed to fetch recipient phone number:', err);
  }
}

onMounted(async () => {
  setLoading(true);
  setToken(token);

  try {
    const validationResult = await validateShareLinkToken(token);

    if (!validationResult.valid || !validationResult.shareLink) {
      const errorType = validationResult.error || 'NOT_FOUND';
      router.replace(`/g/${token}/error?type=${errorType}`);
      return;
    }

    const shareLink = validationResult.shareLink;

    // Fire-and-forget: don't block navigation for analytics
    incrementAccessCount(shareLink.id).catch((err) => {
      console.error('Failed to increment access count:', err);
    });

    const [guidanceSet, steps] = await Promise.all([
      getGuidanceSet(shareLink.guidanceSetId),
      getGuidanceSteps(shareLink.guidanceSetId),
    ]);

    if (!guidanceSet) {
      router.replace(`/g/${token}/error?type=NOT_FOUND`);
      return;
    }

    if (guidanceSet.status === 'DISABLED') {
      router.replace(`/g/${token}/error?type=GUIDANCE_DISABLED`);
      return;
    }

    if (steps.length === 0) {
      router.replace(`/g/${token}/error?type=NO_STEPS`);
      return;
    }

    // Fetch phone number in background — not needed before navigation
    fetchAndStoreRecipientPhone(guidanceSet.recipientUserId);

    setSession(shareLink, guidanceSet, steps);

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
