<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { GButton, GCard } from '@guidenav/ui';
import type { GuidanceSet } from '@guidenav/types';

const router = useRouter();
const guidanceSets = ref<GuidanceSet[]>([]);
const loading = ref(false);

function handleCreateNew() {
  router.push('/guidance/new');
}

function handleSelectGuidance(guidanceSetId: string) {
  router.push(`/guidance/${guidanceSetId}/edit`);
}
</script>

<template>
  <div class="page">
    <header class="page-header">
      <h1 class="page-title">My Guidance</h1>
      <p class="page-subtitle">Manage your delivery guidance</p>
    </header>

    <div class="dashboard-actions">
      <GButton variant="primary" full-width @click="handleCreateNew">
        + Create New Guidance
      </GButton>
    </div>

    <div v-if="loading" class="dashboard-loading">
      Loading...
    </div>

    <div v-else-if="guidanceSets.length === 0" class="dashboard-empty">
      <GCard padding="lg">
        <div class="empty-state">
          <p class="empty-state__title">No guidance created yet</p>
          <p class="empty-state__description">
            Create your first delivery guidance to help couriers find your location
          </p>
        </div>
      </GCard>
    </div>

    <div v-else class="dashboard-list">
      <GCard
        v-for="guidance in guidanceSets"
        :key="guidance.id"
        clickable
        @click="handleSelectGuidance(guidance.id)"
      >
        <div class="guidance-item">
          <h3 class="guidance-item__title">{{ guidance.title }}</h3>
          <p class="guidance-item__status">{{ guidance.status }}</p>
        </div>
      </GCard>
    </div>
  </div>
</template>

<style scoped>
.dashboard-actions {
  margin-bottom: var(--spacing-lg);
}

.dashboard-loading {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--color-text-muted);
}

.dashboard-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.empty-state {
  text-align: center;
  padding: var(--spacing-lg);
}

.empty-state__title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin: 0 0 var(--spacing-sm) 0;
}

.empty-state__description {
  color: var(--color-text-muted);
  margin: 0;
}

.guidance-item__title {
  font-size: var(--font-size-base);
  font-weight: 600;
  margin: 0 0 var(--spacing-xs) 0;
}

.guidance-item__status {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin: 0;
}
</style>
