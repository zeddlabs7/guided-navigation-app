<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { GButton, GCard, GBadge } from '@guidenav/ui';

const router = useRouter();
const route = useRoute();
const guidanceSetId = route.params.guidanceSetId as string;

const shareLink = ref<string | null>(null);
const linkStatus = ref<'ACTIVE' | 'EXPIRED' | 'REVOKED' | null>(null);
const copied = ref(false);
const loading = ref(false);

function handleBack() {
  router.push(`/guidance/${guidanceSetId}/edit`);
}

async function handleGenerateLink() {
  loading.value = true;
  // TODO: Implement generate link
  setTimeout(() => {
    shareLink.value = `${window.location.origin}/g/abc123xyz`;
    linkStatus.value = 'ACTIVE';
    loading.value = false;
  }, 1000);
}

async function handleCopyLink() {
  if (shareLink.value) {
    await navigator.clipboard.writeText(shareLink.value);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  }
}

async function handleRevokeLink() {
  // TODO: Implement revoke
  shareLink.value = null;
  linkStatus.value = null;
}
</script>

<template>
  <div class="page">
    <header class="page-header">
      <GButton variant="ghost" size="sm" @click="handleBack">
        ← Back
      </GButton>
      <h1 class="page-title">Share Link</h1>
      <p class="page-subtitle">Share this link with the courier</p>
    </header>

    <GCard padding="lg">
      <div v-if="!shareLink" class="no-link">
        <p class="no-link__text">No active share link</p>
        <GButton
          variant="primary"
          full-width
          :loading="loading"
          @click="handleGenerateLink"
        >
          Generate Share Link
        </GButton>
      </div>

      <div v-else class="link-info">
        <div class="link-status">
          <GBadge :variant="linkStatus === 'ACTIVE' ? 'success' : 'danger'">
            {{ linkStatus }}
          </GBadge>
        </div>

        <div class="link-url">
          <input
            type="text"
            :value="shareLink"
            readonly
            class="link-input"
          />
          <GButton
            variant="primary"
            @click="handleCopyLink"
          >
            {{ copied ? 'Copied!' : 'Copy' }}
          </GButton>
        </div>

        <div class="link-actions">
          <GButton variant="secondary" @click="handleGenerateLink">
            Regenerate
          </GButton>
          <GButton variant="danger" @click="handleRevokeLink">
            Revoke
          </GButton>
        </div>
      </div>
    </GCard>
  </div>
</template>

<style scoped>
.no-link {
  text-align: center;
}

.no-link__text {
  color: var(--color-text-muted);
  margin-bottom: var(--spacing-lg);
}

.link-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.link-status {
  display: flex;
  justify-content: center;
}

.link-url {
  display: flex;
  gap: var(--spacing-sm);
}

.link-input {
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  background-color: var(--color-disabled);
}

.link-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
}
</style>
