<script setup lang="ts">
import { computed } from 'vue';
import { Doughnut } from 'vue-chartjs';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const props = withDefaults(defineProps<{
  data: Record<string, number>;
  loading?: boolean;
}>(), {});

const colors = [
  '#155dfc',
  '#008236',
  '#bb4d00',
  '#8200db',
  '#dc2626',
  '#0891b2',
  '#65a30d',
  '#db2777',
];

const chartData = computed(() => {
  const entries = Object.entries(props.data).filter(([_, value]) => value > 0);
  return {
    labels: entries.map(([key]) => key),
    datasets: [
      {
        data: entries.map(([_, value]) => value),
        backgroundColor: colors.slice(0, entries.length),
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '60%',
  plugins: {
    legend: {
      position: 'right' as const,
      labels: {
        color: '#4a5565',
        font: {
          size: 12,
        },
        padding: 16,
        usePointStyle: true,
        pointStyle: 'circle',
      },
    },
    tooltip: {
      backgroundColor: '#101828',
      titleColor: '#fff',
      bodyColor: '#fff',
      padding: 12,
      cornerRadius: 8,
      callbacks: {
        label: (context: { label: string; parsed: number; dataset: { data: number[] } }) => {
          const total = context.dataset.data.reduce((a, b) => a + b, 0);
          const percentage = ((context.parsed / total) * 100).toFixed(1);
          return `${context.label}: ${context.parsed} (${percentage}%)`;
        },
      },
    },
  },
};

const isEmpty = computed(() => {
  return Object.values(props.data).every(v => v === 0) || Object.keys(props.data).length === 0;
});
</script>

<template>
  <div class="pie-chart">
    <div v-if="loading" class="chart-loading">
      <div class="skeleton-chart"></div>
    </div>
    <div v-else-if="isEmpty" class="chart-empty">
      No data available
    </div>
    <Doughnut v-else :data="chartData" :options="chartOptions" />
  </div>
</template>

<style scoped>
.pie-chart {
  height: 250px;
  position: relative;
}

.chart-loading,
.chart-empty {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-empty {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.skeleton-chart {
  width: 150px;
  height: 150px;
  background: linear-gradient(90deg, var(--color-border) 25%, var(--color-background) 50%, var(--color-border) 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 50%;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
