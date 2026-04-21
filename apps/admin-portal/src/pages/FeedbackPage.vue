<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import StatCard from '@/components/StatCard.vue';
import DataTable from '@/components/DataTable.vue';
import LineChart from '@/components/LineChart.vue';
import PieChart from '@/components/PieChart.vue';
import { getFeedbackStats, getAllFeedback, getProblematicGuidance } from '@/composables/useAdminAnalytics';
import type { FeedbackEvent } from '@guidenav/types';

const loading = ref(true);
const feedbackEvents = ref<(FeedbackEvent & { guidanceTitle?: string; stepType?: string })[]>([]);
const problematicGuidance = ref<{ id: string; title: string; feedbackCount: number }[]>([]);

const stats = ref({
  total: 0,
  thisWeek: 0,
  byReason: {} as Record<string, number>,
  trendData: { labels: [] as string[], data: [] as number[] },
});

const feedbackColumns = [
  { key: 'guidanceTitle', label: 'Guidance', width: '200px' },
  { key: 'reasonCode', label: 'Reason', width: '150px' },
  { key: 'stepType', label: 'Step Type', width: '120px' },
  { key: 'createdAt', label: 'Reported', width: '150px' },
];

const problematicColumns = [
  { key: 'title', label: 'Guidance', width: '250px' },
  { key: 'feedbackCount', label: 'Feedback Reports', width: '150px' },
];

const feedbackTableData = computed(() => {
  return feedbackEvents.value.map((feedback) => ({
    ...feedback,
    guidanceTitle: feedback.guidanceTitle || feedback.guidanceSetId?.slice(0, 8) || 'Unknown',
    reasonCode: formatReasonCode(feedback.reasonCode),
    stepType: feedback.stepType || 'N/A',
    createdAt: formatDate(feedback.createdAt),
  }));
});

function formatReasonCode(code: string | null | undefined): string {
  if (!code) return 'N/A';
  const labels: Record<string, string> = {
    WRONG_PHOTO: 'Wrong Photo',
    UNCLEAR_DIRECTION: 'Unclear Direction',
    MISSING_STEP: 'Missing Step',
    LOCATION_CONFUSING: 'Confusing Location',
    OTHER: 'Other',
  };
  return labels[code] || code;
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

const reasonBadgeClass = (reason: string) => {
  switch (reason) {
    case 'Wrong Photo':
      return 'badge--danger';
    case 'Unclear Direction':
      return 'badge--warning';
    case 'Missing Step':
      return 'badge--danger';
    case 'Confusing Location':
      return 'badge--warning';
    default:
      return 'badge--neutral';
  }
};

onMounted(async () => {
  try {
    const [feedbackStats, allFeedback, problematic] = await Promise.all([
      getFeedbackStats(),
      getAllFeedback(),
      getProblematicGuidance(),
    ]);
    stats.value = feedbackStats;
    feedbackEvents.value = allFeedback;
    problematicGuidance.value = problematic;
  } catch (error) {
    console.error('Failed to load feedback data:', error);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="page">
    <header class="page-header">
      <h1 class="page-title">Feedback</h1>
      <p class="page-subtitle">Courier feedback and issue tracking</p>
    </header>

    <section class="stats-grid">
      <StatCard
        title="Total Feedback"
        :value="stats.total"
        icon="feedback"
        :loading="loading"
      />
      <StatCard
        title="This Week"
        :value="stats.thisWeek"
        :trend="{ value: -5, label: 'vs last week' }"
        :loading="loading"
      />
      <StatCard
        title="Wrong Photo"
        :value="stats.byReason['WRONG_PHOTO'] || 0"
        :loading="loading"
      />
      <StatCard
        title="Unclear Direction"
        :value="stats.byReason['UNCLEAR_DIRECTION'] || 0"
        :loading="loading"
      />
    </section>

    <section class="charts-grid">
      <div class="chart-container">
        <h3 class="chart-title">Feedback Trend (Last 30 Days)</h3>
        <LineChart
          :labels="stats.trendData.labels"
          :data="stats.trendData.data"
          label="Feedback Reports"
          color="#dc2626"
          :loading="loading"
        />
      </div>
      <div class="chart-container">
        <h3 class="chart-title">Feedback by Reason</h3>
        <PieChart
          :data="Object.fromEntries(
            Object.entries(stats.byReason).map(([key, value]) => [formatReasonCode(key), value])
          )"
          :loading="loading"
        />
      </div>
    </section>

    <section style="margin-bottom: var(--spacing-xl);">
      <h2 class="section-title">Most Problematic Guidance</h2>
      <p class="page-subtitle" style="margin-bottom: var(--spacing-md);">
        Guidance sets with the most feedback reports - consider reviewing these
      </p>
      <DataTable
        :columns="problematicColumns"
        :data="problematicGuidance"
        :loading="loading"
        empty-message="No problematic guidance found"
      >
        <template #cell-feedbackCount="{ value }">
          <span class="badge badge--danger">{{ value }} reports</span>
        </template>
      </DataTable>
    </section>

    <section>
      <h2 class="section-title">All Feedback Reports</h2>
      <DataTable
        :columns="feedbackColumns"
        :data="feedbackTableData"
        :loading="loading"
        empty-message="No feedback reports found"
      >
        <template #cell-reasonCode="{ value }">
          <span :class="['badge', reasonBadgeClass(value as string)]">
            {{ value }}
          </span>
        </template>
      </DataTable>
    </section>
  </div>
</template>
