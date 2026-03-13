<script setup lang="ts">
export interface FilterTab {
  id: string;
  label: string;
  count: number;
}

interface Props {
  tabs: FilterTab[];
  activeTab: string;
}

defineProps<Props>();

const emit = defineEmits<{
  'update:activeTab': [id: string];
}>();
</script>

<template>
  <div class="filter-tabs">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      :class="['filter-tabs__tab', { 'filter-tabs__tab--active': activeTab === tab.id }]"
      @click="emit('update:activeTab', tab.id)"
    >
      <span class="filter-tabs__label">{{ tab.label }}</span>
      <span 
        :class="[
          'filter-tabs__count',
          { 'filter-tabs__count--active': activeTab === tab.id }
        ]"
      >
        {{ tab.count }}
      </span>
    </button>
  </div>
</template>

<style scoped>
.filter-tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 4px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.filter-tabs::-webkit-scrollbar {
  display: none;
}

.filter-tabs__tab {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  height: 32px;
  padding: 0 14px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-tabs__tab:hover:not(.filter-tabs__tab--active) {
  background-color: var(--color-background);
  border-color: var(--color-secondary-dark);
}

.filter-tabs__tab--active {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
  box-shadow: var(--shadow-button);
}

.filter-tabs__count {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  background-color: var(--color-border-light);
  border-radius: var(--radius-full);
  font-size: var(--font-size-2xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-disabled-text);
}

.filter-tabs__count--active {
  background-color: rgba(255, 255, 255, 0.25);
  color: white;
}
</style>
