<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import StatCard from '@/components/StatCard.vue';
import DataTable from '@/components/DataTable.vue';
import PieChart from '@/components/PieChart.vue';
import BarChart from '@/components/BarChart.vue';
import { getGuidanceStats, getAllGuidanceSets } from '@/composables/useAdminAnalytics';
import type { GuidanceSet } from '@guidenav/types';

const loading = ref(true);
const guidanceSets = ref<(GuidanceSet & { stepCount?: number; userName?: string })[]>([]);
const stats = ref({
  total: 0,
  published: 0,
  draft: 0,
  disabled: 0,
  addressTypeBreakdown: {} as Record<string, number>,
  topCreators: [] as { userId: string; phoneNumber: string; count: number }[],
  avgStepsPerGuidance: 0,
});

const columns = [
  { key: 'title', label: 'Title', width: '200px' },
  { key: 'userName', label: 'Created By', width: '150px' },
  { key: 'status', label: 'Status', width: '100px' },
  { key: 'stepCount', label: 'Steps', width: '80px' },
  { key: 'addressType', label: 'Address Type', width: '120px' },
  { key: 'createdAt', label: 'Created', width: '150px' },
];

const tableData = computed(() => {
  return guidanceSets.value.map((guidance) => ({
    ...guidance,
    title: guidance.title || 'Untitled',
    userName: guidance.userName || guidance.recipientUserId?.slice(0, 8) || 'Unknown',
    stepCount: guidance.stepCount ?? 0,
    addressType: formatAddressType(guidance.addressType),
    createdAt: formatDate(guidance.createdAt),
  }));
});

function formatAddressType(type: string | undefined): string {
  if (!type) return 'N/A';
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
}

function formatDate(timestamp: unknown): string {
  if (!timestamp) return 'N/A';
  const date = typeof timestamp === 'object' && 'toDate' in (timestamp as object)
    ? (timestamp as { toDate: () => Date }).toDate()
    : new Date(timestamp as string);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

const statusBadgeClass = (status: string) => {
  switch (status) {
    case 'PUBLISHED':
      return 'badge--success';
    case 'DRAFT':
      return 'badge--warning';
    case 'DISABLED':
      return 'badge--neutral';
    default:
      return 'badge--neutral';
  }
};

onMounted(async () => {
  try {
    const [guidanceStats, allGuidance] = await Promise.all([
      getGuidanceStats(),
      getAllGuidanceSets(),
    ]);
    stats.value = guidanceStats;
    guidanceSets.value = allGuidance;
  } catch (error) {
    console.error('Failed to load guidance data:', error);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="page">
    <header class="page-header">
      <h1 class="page-title">Guidance</h1>
      <p class="page-subtitle">Guidance sets analytics and overview</p>
    </header>

    <section class="stats-grid">
      <StatCard
        title="Total Guidance Sets"
        :value="stats.total"
        icon="guidance"
        :loading="loading"
      />
      <StatCard
        title="Published"
        :value="stats.published"
        :subtitle="`${Math.round((stats.published / stats.total) * 100) || 0}% of total`"
        :loading="loading"
      />
      <StatCard
        title="Draft"
        :value="stats.draft"
        :loading="loading"
      />
      <StatCard
        title="Avg Steps"
        :value="stats.avgStepsPerGuidance.toFixed(1)"
        subtitle="per guidance"
        :loading="loading"
      />
    </section>

    <section class="charts-grid">
      <div class="chart-container">
        <h3 class="chart-title">Status Distribution</h3>
        <PieChart
          :data="{
            'Published': stats.published,
            'Draft': stats.draft,
            'Disabled': stats.disabled
          }"
          :loading="loading"
        />
      </div>
      <div class="chart-container">
        <h3 class="chart-title">By Address Type</h3>
        <PieChart
          :data="stats.addressTypeBreakdown"
          :loading="loading"
        />
      </div>
    </section>

    <section class="charts-grid" style="margin-bottom: var(--spacing-xl);">
      <div class="chart-container">
        <h3 class="chart-title">Top Creators</h3>
        <BarChart
          :labels="stats.topCreators.map(c => c.phoneNumber || c.userId.slice(0, 8))"
          :data="stats.topCreators.map(c => c.count)"
          label="Guidance Sets"
          :loading="loading"
        />
      </div>
    </section>

    <section>
      <h2 class="section-title">All Guidance Sets</h2>
      <DataTable
        :columns="columns"
        :data="tableData"
        :loading="loading"
        empty-message="No guidance sets found"
      >
        <template #cell-status="{ value }">
          <span :class="['badge', statusBadgeClass(value as string)]">
            {{ value }}
          </span>
        </template>
      </DataTable>
    </section>
  </div>
</template>
