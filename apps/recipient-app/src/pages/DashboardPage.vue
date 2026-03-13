<script setup lang="ts">
import { ref, computed } from 'vue';
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

const router = useRouter();
const loading = ref(false);
const searchQuery = ref('');
const activeFilter = ref('all');
const currentLanguage = ref<'en' | 'ar'>('en');

interface GuidanceSetWithSteps extends GuidanceSet {
  steps: GuidanceStep[];
  titleArabic?: string;
  expiresDate?: string;
}

const guidanceSets = ref<GuidanceSetWithSteps[]>([
  {
    id: '1',
    recipientUserId: 'user1',
    title: 'Al Nakheel Tower – Delivery Guide',
    titleArabic: 'برج النخيل – دليل التوصيل',
    description: null,
    status: 'PUBLISHED',
    languageOriginal: 'en',
    supportedLanguages: ['en', 'ar'],
    availabilityMode: 'ANYTIME_TODAY',
    availabilityStartTs: null,
    availabilityEndTs: null,
    timezone: 'Asia/Riyadh',
    destinationCoordinates: null,
    currentVersion: 1,
    publishedAt: { seconds: 1707580800, nanoseconds: 0 },
    createdAt: { seconds: 1707580800, nanoseconds: 0 },
    updatedAt: { seconds: 1707580800, nanoseconds: 0 },
    deletedAt: null,
    expiresDate: '1 Jun 2026',
    steps: [
      {
        id: 's1',
        guidanceSetId: '1',
        stepIndex: 0,
        stepType: 'APPROACH',
        contentType: 'PHOTO',
        title: 'Parking',
        instructionOriginal: 'Park here',
        instructionTranslations: {},
        image: { storagePath: '', publicUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400', width: 400, height: 300, fileSize: 50000, mimeType: 'image/jpeg' },
        overlays: [],
        isRequired: true,
        createdAt: { seconds: 1707580800, nanoseconds: 0 },
        updatedAt: { seconds: 1707580800, nanoseconds: 0 },
        deletedAt: null,
      },
      {
        id: 's2',
        guidanceSetId: '1',
        stepIndex: 1,
        stepType: 'PIN_CHECK',
        contentType: 'PHOTO',
        title: 'PIN Check',
        instructionOriginal: 'Enter PIN',
        instructionTranslations: {},
        image: { storagePath: '', publicUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400', width: 400, height: 300, fileSize: 50000, mimeType: 'image/jpeg' },
        overlays: [],
        isRequired: true,
        createdAt: { seconds: 1707580800, nanoseconds: 0 },
        updatedAt: { seconds: 1707580800, nanoseconds: 0 },
        deletedAt: null,
      },
      {
        id: 's3',
        guidanceSetId: '1',
        stepIndex: 2,
        stepType: 'ELEVATOR',
        contentType: 'PHOTO',
        title: 'Elevator',
        instructionOriginal: 'Take elevator',
        instructionTranslations: {},
        image: { storagePath: '', publicUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400', width: 400, height: 300, fileSize: 50000, mimeType: 'image/jpeg' },
        overlays: [],
        isRequired: true,
        createdAt: { seconds: 1707580800, nanoseconds: 0 },
        updatedAt: { seconds: 1707580800, nanoseconds: 0 },
        deletedAt: null,
      },
      {
        id: 's4',
        guidanceSetId: '1',
        stepIndex: 3,
        stepType: 'DOOR_ENTRY',
        contentType: 'PHOTO',
        title: 'Door Entry',
        instructionOriginal: 'Ring doorbell',
        instructionTranslations: {},
        image: null,
        overlays: [],
        isRequired: true,
        createdAt: { seconds: 1707580800, nanoseconds: 0 },
        updatedAt: { seconds: 1707580800, nanoseconds: 0 },
        deletedAt: null,
      },
    ],
  },
  {
    id: '2',
    recipientUserId: 'user1',
    title: 'Business Bay Office – Floor 12',
    titleArabic: 'مكتب بيزنس باي – الطابق ١٢',
    description: null,
    status: 'DRAFT',
    languageOriginal: 'en',
    supportedLanguages: ['en', 'ar'],
    availabilityMode: 'ANYTIME_TODAY',
    availabilityStartTs: null,
    availabilityEndTs: null,
    timezone: 'Asia/Riyadh',
    destinationCoordinates: null,
    currentVersion: 1,
    publishedAt: null,
    createdAt: { seconds: 1708300800, nanoseconds: 0 },
    updatedAt: { seconds: 1708300800, nanoseconds: 0 },
    deletedAt: null,
    steps: [
      {
        id: 's5',
        guidanceSetId: '2',
        stepIndex: 0,
        stepType: 'GATE_ENTRY',
        contentType: 'PHOTO',
        title: 'Gate Entry',
        instructionOriginal: 'Enter gate',
        instructionTranslations: {},
        image: { storagePath: '', publicUrl: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=400', width: 400, height: 300, fileSize: 50000, mimeType: 'image/jpeg' },
        overlays: [],
        isRequired: true,
        createdAt: { seconds: 1708300800, nanoseconds: 0 },
        updatedAt: { seconds: 1708300800, nanoseconds: 0 },
        deletedAt: null,
      },
      {
        id: 's6',
        guidanceSetId: '2',
        stepIndex: 1,
        stepType: 'ELEVATOR',
        contentType: 'PHOTO',
        title: 'Elevator',
        instructionOriginal: 'Take elevator to floor 12',
        instructionTranslations: {},
        image: { storagePath: '', publicUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400', width: 400, height: 300, fileSize: 50000, mimeType: 'image/jpeg' },
        overlays: [],
        isRequired: true,
        createdAt: { seconds: 1708300800, nanoseconds: 0 },
        updatedAt: { seconds: 1708300800, nanoseconds: 0 },
        deletedAt: null,
      },
    ],
  },
  {
    id: '3',
    recipientUserId: 'user1',
    title: 'Marina Residence – Villa 7',
    titleArabic: 'مارينا ريزيدنس – فيلا ٧',
    description: null,
    status: 'DISABLED',
    languageOriginal: 'en',
    supportedLanguages: ['en', 'ar'],
    availabilityMode: 'ANYTIME_TODAY',
    availabilityStartTs: null,
    availabilityEndTs: null,
    timezone: 'Asia/Riyadh',
    destinationCoordinates: null,
    currentVersion: 1,
    publishedAt: null,
    createdAt: { seconds: 1701734400, nanoseconds: 0 },
    updatedAt: { seconds: 1701734400, nanoseconds: 0 },
    deletedAt: null,
    steps: [
      {
        id: 's7',
        guidanceSetId: '3',
        stepIndex: 0,
        stepType: 'GATE_ENTRY',
        contentType: 'PHOTO',
        title: 'Gate Entry',
        instructionOriginal: 'Enter main gate',
        instructionTranslations: {},
        image: { storagePath: '', publicUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400', width: 400, height: 300, fileSize: 50000, mimeType: 'image/jpeg' },
        overlays: [],
        isRequired: true,
        createdAt: { seconds: 1701734400, nanoseconds: 0 },
        updatedAt: { seconds: 1701734400, nanoseconds: 0 },
        deletedAt: null,
      },
    ],
  },
]);

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

function formatDate(timestamp: { seconds: number; nanoseconds: number }): string {
  const date = new Date(timestamp.seconds * 1000);
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

function handleMenu(id: string) {
  console.log('Menu clicked for:', id);
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
        <h1 class="dashboard__title">My Guidance Sets</h1>
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
          }))"
          :modified-date="formatDate(guidance.updatedAt)"
          :expires-date="guidance.expiresDate"
          :is-link-disabled="guidance.status === 'DISABLED'"
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

.dashboard__empty {
  margin-top: 16px;
}

.empty-state {
  text-align: center;
  padding: 24px;
}

.empty-state__title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  margin: 0 0 8px;
}

.empty-state__description {
  font-size: var(--font-size-base);
  color: var(--color-text-muted);
  margin: 0;
}
</style>
