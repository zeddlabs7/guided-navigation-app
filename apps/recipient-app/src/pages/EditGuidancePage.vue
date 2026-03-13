<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { GButton, GCard, GInput } from '@guidenav/ui';

const router = useRouter();
const route = useRoute();
const guidanceSetId = route.params.guidanceSetId as string;

const title = ref('');
const loading = ref(false);

function handleBack() {
  router.push('/dashboard');
}

function handleSteps() {
  router.push(`/guidance/${guidanceSetId}/steps`);
}

function handlePreview() {
  router.push(`/guidance/${guidanceSetId}/preview`);
}

function handleShare() {
  router.push(`/guidance/${guidanceSetId}/share`);
}

async function handleSave() {
  loading.value = true;
  // TODO: Implement save
  setTimeout(() => {
    loading.value = false;
  }, 500);
}
</script>

<template>
  <div class="page">
    <header class="page-header">
      <GButton variant="ghost" size="sm" @click="handleBack">
        ← Back
      </GButton>
      <h1 class="page-title">Edit Guidance</h1>
    </header>

    <div class="edit-content">
      <GCard padding="lg">
        <form class="edit-form" @submit.prevent="handleSave">
          <GInput
            v-model="title"
            label="Title"
            placeholder="Guidance title"
          />
          <GButton type="submit" variant="primary" :loading="loading">
            Save Changes
          </GButton>
        </form>
      </GCard>

      <div class="action-cards">
        <GCard clickable @click="handleSteps">
          <div class="action-card">
            <span class="action-card__icon">📷</span>
            <span class="action-card__label">Edit Steps</span>
          </div>
        </GCard>

        <GCard clickable @click="handlePreview">
          <div class="action-card">
            <span class="action-card__icon">👁️</span>
            <span class="action-card__label">Preview</span>
          </div>
        </GCard>

        <GCard clickable @click="handleShare">
          <div class="action-card">
            <span class="action-card__icon">🔗</span>
            <span class="action-card__label">Share Link</span>
          </div>
        </GCard>
      </div>
    </div>
  </div>
</template>

<style scoped>
.edit-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.action-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
}

.action-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  text-align: center;
}

.action-card__icon {
  font-size: 1.5rem;
}

.action-card__label {
  font-size: var(--font-size-sm);
  font-weight: 500;
}
</style>
