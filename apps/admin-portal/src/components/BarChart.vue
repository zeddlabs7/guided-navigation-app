<script setup lang="ts">
import { computed } from 'vue';
import { Bar } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const props = withDefaults(defineProps<{
  labels: string[];
  data: number[];
  label?: string;
  color?: string;
  loading?: boolean;
}>(), {
  label: 'Value',
  color: '#155dfc',
});

const chartData = computed(() => ({
  labels: props.labels,
  datasets: [
    {
      label: props.label,
      data: props.data,
      backgroundColor: props.color,
      borderRadius: 6,
      borderSkipped: false,
      maxBarThickness: 50,
    },
  ],
}));

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y' as const,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      backgroundColor: '#101828',
      titleColor: '#fff',
      bodyColor: '#fff',
      padding: 12,
      cornerRadius: 8,
      displayColors: false,
    },
  },
  scales: {
    x: {
      beginAtZero: true,
      grid: {
        color: '#f3f4f6',
      },
      ticks: {
        color: '#99a1af',
        font: {
          size: 11,
        },
      },
      border: {
        display: false,
      },
    },
    y: {
      grid: {
        display: false,
      },
      ticks: {
        color: '#4a5565',
        font: {
          size: 12,
        },
      },
      border: {
        display: false,
      },
    },
  },
};
</script>

<template>
  <div class="bar-chart">
    <div v-if="loading" class="chart-loading">
      <div class="skeleton-chart"></div>
    </div>
    <div v-else-if="data.length === 0" class="chart-empty">
      No data available
    </div>
    <Bar v-else :data="chartData" :options="chartOptions" />
  </div>
</template>

<style scoped>
.bar-chart {
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
  width: 100%;
  height: 200px;
  background: linear-gradient(90deg, var(--color-border) 25%, var(--color-background) 50%, var(--color-border) 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: var(--radius-md);
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
