<script setup lang="ts">
import { ref, onMounted } from 'vue';
import StatCard from '@/components/StatCard.vue';
import LineChart from '@/components/LineChart.vue';
import PieChart from '@/components/PieChart.vue';
import {
  getUserStats,
  getGuidanceStats,
  getDeliveryStats,
  getFeedbackStats,
} from '@/composables/useAdminAnalytics';

const loading = ref(true);

const userStats = ref({ total: 0, newThisWeek: 0, active: 0 });
const guidanceStats = ref({ total: 0, published: 0, draft: 0 });
const deliveryStats = ref({ total: 0, thisWeek: 0, completionRate: 0 });
const feedbackStats = ref({ total: 0, thisWeek: 0, byReason: {} as Record<string, number> });

const userGrowthData = ref<{ labels: string[]; data: number[] }>({ labels: [], data: [] });
const deliveryTrendData = ref<{ labels: string[]; data: number[] }>({ labels: [], data: [] });

onMounted(async () => {
  try {
    const [users, guidance, deliveries, feedback] = await Promise.all([
      getUserStats(),
      getGuidanceStats(),
      getDeliveryStats(),
      getFeedbackStats(),
    ]);

    userStats.value = users;
    guidanceStats.value = guidance;
    deliveryStats.value = deliveries;
    feedbackStats.value = feedback;

    userGrowthData.value = users.growthData || { labels: [], data: [] };
    deliveryTrendData.value = deliveries.trendData || { labels: [], data: [] };
  } catch (error) {
    console.error('Failed to load dashboard stats:', error);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="page">
    <header class="page-header">
      <h1 class="page-title">Dashboard</h1>
      <p class="page-subtitle">Overview of your application analytics</p>
    </header>

    <section class="stats-grid">
      <StatCard
        title="Total Users"
        :value="userStats.total"
        :subtitle="`${userStats.active} active`"
        :trend="{ value: 12, label: 'this week' }"
        icon="users"
        :loading="loading"
      />
      <StatCard
        title="Guidance Sets"
        :value="guidanceStats.total"
        :subtitle="`${guidanceStats.published} published`"
        icon="guidance"
        :loading="loading"
      />
      <StatCard
        title="Deliveries"
        :value="deliveryStats.total"
        :subtitle="`${deliveryStats.thisWeek} this week`"
        icon="deliveries"
        :loading="loading"
      />
      <StatCard
        title="Feedback Reports"
        :value="feedbackStats.total"
        :subtitle="`${feedbackStats.thisWeek} this week`"
        icon="feedback"
        :loading="loading"
      />
    </section>

    <section class="charts-grid">
      <div class="chart-container">
        <h3 class="chart-title">User Signups (Last 30 Days)</h3>
        <LineChart
          :labels="userGrowthData.labels"
          :data="userGrowthData.data"
          label="New Users"
          :loading="loading"
        />
      </div>
      <div class="chart-container">
        <h3 class="chart-title">Deliveries (Last 30 Days)</h3>
        <LineChart
          :labels="deliveryTrendData.labels"
          :data="deliveryTrendData.data"
          label="Deliveries"
          color="#008236"
          :loading="loading"
        />
      </div>
    </section>

    <section class="charts-grid">
      <div class="chart-container">
        <h3 class="chart-title">Feedback by Reason</h3>
        <PieChart
          :data="feedbackStats.byReason"
          :loading="loading"
        />
      </div>
      <div class="chart-container">
        <h3 class="chart-title">Guidance Status</h3>
        <PieChart
          :data="{
            'Published': guidanceStats.published,
            'Draft': guidanceStats.draft,
            'Disabled': guidanceStats.total - guidanceStats.published - guidanceStats.draft
          }"
          :loading="loading"
        />
      </div>
    </section>
  </div>
</template>
