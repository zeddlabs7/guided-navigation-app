<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import StatCard from '@/components/StatCard.vue';
import DataTable from '@/components/DataTable.vue';
import LineChart from '@/components/LineChart.vue';
import PieChart from '@/components/PieChart.vue';
import { getDeliveryStats, getShareLinkStats, getAllShareLinks } from '@/composables/useAdminAnalytics';
import type { ShareLink } from '@guidenav/types';

const loading = ref(true);
const shareLinks = ref<(ShareLink & { guidanceTitle?: string })[]>([]);

const deliveryStats = ref({
  total: 0,
  thisWeek: 0,
  completionRate: 0,
  trendData: { labels: [] as string[], data: [] as number[] },
});

const linkStats = ref({
  total: 0,
  active: 0,
  revoked: 0,
  expired: 0,
  totalAccesses: 0,
  validationErrors: {} as Record<string, number>,
});

const columns = [
  { key: 'guidanceTitle', label: 'Guidance', width: '200px' },
  { key: 'status', label: 'Status', width: '100px' },
  { key: 'accessCount', label: 'Accesses', width: '100px' },
  { key: 'expiresAt', label: 'Expires', width: '150px' },
  { key: 'createdAt', label: 'Created', width: '150px' },
];

const tableData = computed(() => {
  return shareLinks.value.map((link) => ({
    ...link,
    guidanceTitle: link.guidanceTitle || link.guidanceSetId?.slice(0, 8) || 'Unknown',
    expiresAt: formatDate(link.expiresAt),
    createdAt: formatDate(link.createdAt),
  }));
});

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
    case 'ACTIVE':
      return 'badge--success';
    case 'REVOKED':
      return 'badge--danger';
    case 'EXPIRED':
      return 'badge--neutral';
    default:
      return 'badge--neutral';
  }
};

onMounted(async () => {
  try {
    const [deliveries, links, allLinks] = await Promise.all([
      getDeliveryStats(),
      getShareLinkStats(),
      getAllShareLinks(),
    ]);
    deliveryStats.value = deliveries;
    linkStats.value = links;
    shareLinks.value = allLinks;
  } catch (error) {
    console.error('Failed to load delivery data:', error);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="page">
    <header class="page-header">
      <h1 class="page-title">Deliveries</h1>
      <p class="page-subtitle">Delivery completions and share link analytics</p>
    </header>

    <section class="stats-grid">
      <StatCard
        title="Total Deliveries"
        :value="deliveryStats.total"
        icon="deliveries"
        :loading="loading"
      />
      <StatCard
        title="This Week"
        :value="deliveryStats.thisWeek"
        :trend="{ value: 8, label: 'vs last week' }"
        :loading="loading"
      />
      <StatCard
        title="Completion Rate"
        :value="`${deliveryStats.completionRate}%`"
        subtitle="of opened links"
        :loading="loading"
      />
      <StatCard
        title="Total Link Accesses"
        :value="linkStats.totalAccesses"
        icon="links"
        :loading="loading"
      />
    </section>

    <section class="charts-grid">
      <div class="chart-container">
        <h3 class="chart-title">Deliveries (Last 30 Days)</h3>
        <LineChart
          :labels="deliveryStats.trendData.labels"
          :data="deliveryStats.trendData.data"
          label="Deliveries"
          color="#008236"
          :loading="loading"
        />
      </div>
      <div class="chart-container">
        <h3 class="chart-title">Share Link Status</h3>
        <PieChart
          :data="{
            'Active': linkStats.active,
            'Revoked': linkStats.revoked,
            'Expired': linkStats.expired
          }"
          :loading="loading"
        />
      </div>
    </section>

    <section class="charts-grid" style="margin-bottom: var(--spacing-xl);">
      <div class="chart-container">
        <h3 class="chart-title">Validation Errors</h3>
        <PieChart
          :data="linkStats.validationErrors"
          :loading="loading"
        />
        <p v-if="Object.keys(linkStats.validationErrors).length === 0 && !loading" class="empty-state">
          No validation errors recorded
        </p>
      </div>
    </section>

    <section>
      <h2 class="section-title">Recent Share Links</h2>
      <DataTable
        :columns="columns"
        :data="tableData"
        :loading="loading"
        empty-message="No share links found"
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
