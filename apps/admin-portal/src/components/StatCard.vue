<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  title: string;
  value: number | string;
  subtitle?: string;
  trend?: {
    value: number;
    label: string;
  };
  icon?: 'users' | 'guidance' | 'deliveries' | 'feedback' | 'links';
  loading?: boolean;
}>();

const formattedValue = computed(() => {
  if (typeof props.value === 'number') {
    return props.value.toLocaleString();
  }
  return props.value;
});

const trendClass = computed(() => {
  if (!props.trend) return '';
  return props.trend.value >= 0 ? 'trend--positive' : 'trend--negative';
});

const trendIcon = computed(() => {
  if (!props.trend) return '';
  return props.trend.value >= 0 ? '↑' : '↓';
});
</script>

<template>
  <div class="stat-card">
    <div class="stat-header">
      <span class="stat-title">{{ title }}</span>
      <span v-if="icon" class="stat-icon">
        <svg v-if="icon === 'users'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        <svg v-else-if="icon === 'guidance'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="3 11 22 2 13 21 11 13 3 11" />
        </svg>
        <svg v-else-if="icon === 'deliveries'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <svg v-else-if="icon === 'feedback'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <svg v-else-if="icon === 'links'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      </span>
    </div>
    
    <div v-if="loading" class="stat-loading">
      <div class="skeleton skeleton-value"></div>
      <div class="skeleton skeleton-subtitle"></div>
    </div>
    
    <template v-else>
      <div class="stat-value">{{ formattedValue }}</div>
      
      <div class="stat-footer">
        <span v-if="subtitle" class="stat-subtitle">{{ subtitle }}</span>
        <span v-if="trend" :class="['stat-trend', trendClass]">
          {{ trendIcon }} {{ Math.abs(trend.value) }}% {{ trend.label }}
        </span>
      </div>
    </template>
  </div>
</template>

<style scoped>
.stat-card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
}

.stat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-sm);
}

.stat-title {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-text-secondary);
}

.stat-icon {
  color: var(--color-text-muted);
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.2;
  margin-bottom: var(--spacing-xs);
}

.stat-footer {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.stat-subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.stat-trend {
  font-size: var(--font-size-sm);
  font-weight: 500;
}

.trend--positive {
  color: var(--color-success);
}

.trend--negative {
  color: var(--color-danger);
}

.stat-loading {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.skeleton {
  background: linear-gradient(90deg, var(--color-border) 25%, var(--color-background) 50%, var(--color-border) 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: var(--radius-sm);
}

.skeleton-value {
  height: 2.5rem;
  width: 80px;
}

.skeleton-subtitle {
  height: 1rem;
  width: 120px;
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
