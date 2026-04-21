<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import StatCard from '@/components/StatCard.vue';
import DataTable from '@/components/DataTable.vue';
import LineChart from '@/components/LineChart.vue';
import PieChart from '@/components/PieChart.vue';
import { getUserStats, getAllUsers } from '@/composables/useAdminAnalytics';
import type { User } from '@guidenav/types';

const loading = ref(true);
const users = ref<(User & { guidanceCount?: number })[]>([]);
const stats = ref({
  total: 0,
  newThisWeek: 0,
  active: 0,
  inactive: 0,
  languageBreakdown: {} as Record<string, number>,
  growthData: { labels: [] as string[], data: [] as number[] },
});

const columns = [
  { key: 'phoneNumber', label: 'Phone Number', width: '180px' },
  { key: 'languagePreference', label: 'Language', width: '100px' },
  { key: 'guidanceCount', label: 'Guidance Sets', width: '120px' },
  { key: 'isActive', label: 'Status', width: '100px' },
  { key: 'createdAt', label: 'Joined', width: '150px' },
];

const tableData = computed(() => {
  return users.value.map((user) => ({
    ...user,
    phoneNumber: user.phoneNumber || 'N/A',
    languagePreference: user.languagePreference === 'ar' ? 'Arabic' : 'English',
    guidanceCount: user.guidanceCount ?? 0,
    createdAt: formatDate(user.createdAt),
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

onMounted(async () => {
  try {
    const [userStats, allUsers] = await Promise.all([
      getUserStats(),
      getAllUsers(),
    ]);
    stats.value = userStats;
    users.value = allUsers;
  } catch (error) {
    console.error('Failed to load user data:', error);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="page">
    <header class="page-header">
      <h1 class="page-title">Users</h1>
      <p class="page-subtitle">User analytics and management</p>
    </header>

    <section class="stats-grid">
      <StatCard
        title="Total Users"
        :value="stats.total"
        icon="users"
        :loading="loading"
      />
      <StatCard
        title="New This Week"
        :value="stats.newThisWeek"
        :trend="{ value: 15, label: 'vs last week' }"
        :loading="loading"
      />
      <StatCard
        title="Active Users"
        :value="stats.active"
        :subtitle="`${stats.inactive} inactive`"
        :loading="loading"
      />
    </section>

    <section class="charts-grid">
      <div class="chart-container">
        <h3 class="chart-title">User Growth (Last 30 Days)</h3>
        <LineChart
          :labels="stats.growthData.labels"
          :data="stats.growthData.data"
          label="New Users"
          :loading="loading"
        />
      </div>
      <div class="chart-container">
        <h3 class="chart-title">Language Preference</h3>
        <PieChart
          :data="stats.languageBreakdown"
          :loading="loading"
        />
      </div>
    </section>

    <section>
      <h2 class="section-title">All Users</h2>
      <DataTable
        :columns="columns"
        :data="tableData"
        :loading="loading"
        empty-message="No users found"
      >
        <template #cell-isActive="{ value }">
          <span :class="['badge', value ? 'badge--success' : 'badge--neutral']">
            {{ value ? 'Active' : 'Inactive' }}
          </span>
        </template>
      </DataTable>
    </section>
  </div>
</template>
