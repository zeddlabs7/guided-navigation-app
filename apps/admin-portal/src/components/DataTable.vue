<script setup lang="ts">
import { computed } from 'vue';

export interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
}

const props = defineProps<{
  columns: Column[];
  data: Record<string, unknown>[];
  loading?: boolean;
  emptyMessage?: string;
}>();

const emit = defineEmits<{
  (e: 'row-click', row: Record<string, unknown>): void;
}>();

const isEmpty = computed(() => !props.loading && props.data.length === 0);
</script>

<template>
  <div class="data-table-container">
    <table class="data-table">
      <thead>
        <tr>
          <th
            v-for="column in columns"
            :key="column.key"
            :style="column.width ? { width: column.width } : {}"
          >
            {{ column.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <template v-if="loading">
          <tr v-for="i in 5" :key="i">
            <td v-for="column in columns" :key="column.key">
              <div class="skeleton"></div>
            </td>
          </tr>
        </template>
        
        <template v-else-if="isEmpty">
          <tr>
            <td :colspan="columns.length" class="empty-cell">
              {{ emptyMessage || 'No data available' }}
            </td>
          </tr>
        </template>
        
        <template v-else>
          <tr
            v-for="(row, index) in data"
            :key="index"
            @click="emit('row-click', row)"
          >
            <td v-for="column in columns" :key="column.key">
              <slot :name="`cell-${column.key}`" :row="row" :value="row[column.key]">
                {{ row[column.key] }}
              </slot>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.data-table-container {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}

.data-table th,
.data-table td {
  padding: var(--spacing-sm) var(--spacing-md);
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}

.data-table th {
  font-weight: 600;
  color: var(--color-text-secondary);
  background: var(--color-background);
  position: sticky;
  top: 0;
}

.data-table tbody tr {
  cursor: pointer;
  transition: background 0.15s ease;
}

.data-table tbody tr:hover td {
  background: var(--color-background);
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.empty-cell {
  text-align: center;
  color: var(--color-text-muted);
  padding: var(--spacing-2xl) !important;
}

.skeleton {
  height: 1rem;
  width: 80%;
  background: linear-gradient(90deg, var(--color-border) 25%, var(--color-background) 50%, var(--color-border) 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: var(--radius-sm);
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
