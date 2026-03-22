<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { 
  AppLayout, 
  GSearchInput, 
  FilterTabs, 
  GuidanceSetCard,
  GCard,
  GSpinner
} from '@guidenav/ui';
import type { FilterTab } from '@guidenav/ui';
import type { GuidanceSet, GuidanceStep, GuidanceStatus } from '@guidenav/types';
import { getUserGuidanceSets, getAllStepsForGuidanceSets, deleteGuidanceSet } from '@guidenav/services';
import { useAuth } from '../composables/useAuth';

const router = useRouter();
const { userId } = useAuth();

const loading = ref(true);
const error = ref<string | null>(null);
const searchQuery = ref('');
const activeFilter = ref('all');
const currentLanguage = ref<'en' | 'ar'>('en');
const deletingId = ref<string | null>(null);

interface GuidanceSetWithSteps extends GuidanceSet {
  steps: GuidanceStep[];
  titleArabic?: string;
  expiresDate?: string;
}

const guidanceSets = ref<GuidanceSetWithSteps[]>([]);

async function loadGuidanceSets() {
  loading.value = true;
  error.value = null;
  
  try {
    const sets = await getUserGuidanceSets(userId.value);
    
    if (sets.length === 0) {
      guidanceSets.value = [];
      return;
    }
    
    const setIds = sets.map(s => s.id);
    const stepsMap = await getAllStepsForGuidanceSets(setIds);
    
    guidanceSets.value = sets.map(set => ({
      ...set,
      steps: stepsMap.get(set.id) || [],
      titleArabic: undefined,
      expiresDate: undefined,
    }));
  } catch (err) {
    console.error('Failed to load guidance sets:', err);
    error.value = 'Failed to load your guidance sets. Please try again.';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadGuidanceSets();
});

const filterTabs = computed<FilterTab[]>(() => {
  const counts = {
    all: guidanceSets.value.length,
    published: guidanceSets.value.filter(g => g.status === 'PUBLISHED').length,
    draft: guidanceSets.value.filter(g => g.status === 'DRAFT').length,
    disabled: guidanceSets.value.filter(g => g.status === 'DISABLED').length,
  };
  
  return [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'published', label: 'Published', count: counts.published },
    { id: 'draft', label: 'Draft', count: counts.draft },
    { id: 'disabled', label: 'Disabled', count: counts.disabled },
  ];
});

const filteredGuidanceSets = computed(() => {
  let filtered = guidanceSets.value;
  
  if (activeFilter.value !== 'all') {
    const statusMap: Record<string, GuidanceStatus> = {
      published: 'PUBLISHED',
      draft: 'DRAFT',
      disabled: 'DISABLED',
    };
    filtered = filtered.filter(g => g.status === statusMap[activeFilter.value]);
  }
  
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(g => 
      g.title.toLowerCase().includes(query) ||
      g.titleArabic?.toLowerCase().includes(query)
    );
  }
  
  return filtered;
});

function formatDate(timestamp: string | { toDate?: () => Date } | null): string {
  if (!timestamp) return '';
  
  let date: Date;
  if (typeof timestamp === 'string') {
    date = new Date(timestamp);
  } else if (timestamp.toDate) {
    date = timestamp.toDate();
  } else {
    return '';
  }
  
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function handleCreateNew() {
  router.push('/guidance/new');
}

function handleLogoClick() {
  router.push('/dashboard');
}

function handleLanguageToggle() {
  currentLanguage.value = currentLanguage.value === 'en' ? 'ar' : 'en';
}

function handleEdit(id: string) {
  router.push(`/guidance/${id}/edit`);
}

function handleShare(id: string) {
  router.push(`/guidance/${id}/share`);
}

async function handleDelete(id: string) {
  const guidance = guidanceSets.value.find(g => g.id === id);
  if (!guidance) return;
  
  const confirmed = window.confirm(`Are you sure you want to delete "${guidance.title}"? This action cannot be undone.`);
  if (!confirmed) return;
  
  deletingId.value = id;
  
  try {
    await deleteGuidanceSet(id);
    guidanceSets.value = guidanceSets.value.filter(g => g.id !== id);
  } catch (err) {
    console.error('Failed to delete guidance set:', err);
    alert('Failed to delete. Please try again.');
  } finally {
    deletingId.value = null;
  }
}

function handleMenu(id: string) {
  handleDelete(id);
}
</script>

<template>
  <AppLayout
    :current-language="currentLanguage"
    @new-click="handleCreateNew"
    @language-toggle="handleLanguageToggle"
    @logo-click="handleLogoClick"
  >
    <div class="dashboard">
      <header class="dashboard__header">
        <h1 class="dashboard__title">My Addresses</h1>
        <p class="dashboard__subtitle">
          Create and manage step-by-step delivery guidance for couriers.
        </p>
      </header>

      <div class="dashboard__search">
        <GSearchInput
          v-model="searchQuery"
          placeholder="Search guidance…"
        />
      </div>

      <div class="dashboard__filters">
        <FilterTabs
          :tabs="filterTabs"
          :active-tab="activeFilter"
          @update:active-tab="activeFilter = $event"
        />
      </div>

      <div v-if="loading" class="dashboard__loading">
        <GSpinner />
      </div>

      <div v-else-if="error" class="dashboard__error">
        <GCard padding="lg">
          <div class="error-state">
            <p class="error-state__title">Something went wrong</p>
            <p class="error-state__description">{{ error }}</p>
            <button class="error-state__retry" @click="loadGuidanceSets">
              Try Again
            </button>
          </div>
        </GCard>
      </div>

      <div v-else-if="filteredGuidanceSets.length === 0" class="dashboard__empty">
        <GCard padding="lg">
          <div class="empty-state">
            <p class="empty-state__title">
              {{ searchQuery ? 'No results found' : 'No guidance created yet' }}
            </p>
            <p class="empty-state__description">
              {{ searchQuery 
                ? 'Try adjusting your search or filter criteria.' 
                : 'Create your first delivery guidance to help couriers find your location.' 
              }}
            </p>
          </div>
        </GCard>
      </div>

      <div v-else class="dashboard__list">
        <GuidanceSetCard
          v-for="guidance in filteredGuidanceSets"
          :key="guidance.id"
          :id="guidance.id"
          :title="guidance.title"
          :title-arabic="guidance.titleArabic"
          :status="guidance.status"
          :step-count="guidance.steps.length"
          :steps="guidance.steps.map(s => ({
            id: s.id,
            stepType: s.stepType,
            imageUrl: s.image?.publicUrl || null,
            overlays: s.overlays || [],
          }))"
          :modified-date="formatDate(guidance.updatedAt)"
          :expires-date="guidance.expiresDate"
          :is-link-disabled="guidance.status === 'DISABLED'"
          :class="{ 'card--deleting': deletingId === guidance.id }"
          @edit="handleEdit"
          @share="handleShare"
          @menu="handleMenu"
        />
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
.dashboard {
  flex: 1;
  padding: 24px 16px;
  max-width: 100%;
}

@media (min-width: 640px) {
  .dashboard {
    max-width: 400px;
    margin: 0 auto;
  }
}

.dashboard__header {
  margin-bottom: 24px;
}

.dashboard__title {
  margin: 0 0 4px;
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
  line-height: 1.5;
}

.dashboard__subtitle {
  margin: 0;
  font-size: var(--font-size-base);
  color: var(--color-text-muted);
  line-height: 1.4;
}

.dashboard__search {
  margin-bottom: 16px;
}

.dashboard__filters {
  margin-bottom: 20px;
}

.dashboard__loading {
  display: flex;
  justify-content: center;
  padding: 48px 0;
}

.dashboard__list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dashboard__empty,
.dashboard__error {
  margin-top: 16px;
}

.empty-state,
.error-state {
  text-align: center;
  padding: 24px;
}

.empty-state__title,
.error-state__title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  margin: 0 0 8px;
}

.empty-state__description,
.error-state__description {
  font-size: var(--font-size-base);
  color: var(--color-text-muted);
  margin: 0;
}

.error-state__retry {
  margin-top: 16px;
  padding: 10px 20px;
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.error-state__retry:hover {
  background-color: var(--color-primary-dark);
}

.card--deleting {
  opacity: 0.5;
  pointer-events: none;
}
</style>
