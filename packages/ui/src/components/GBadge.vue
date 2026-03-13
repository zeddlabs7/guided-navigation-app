<script setup lang="ts">
interface Props {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
}

withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'md',
});
</script>

<template>
  <span :class="['g-badge', `g-badge--${variant}`, `g-badge--${size}`]">
    <slot />
  </span>
</template>

<style scoped>
.g-badge {
  display: inline-flex;
  align-items: center;
  font-weight: 500;
  border-radius: 9999px;
}

.g-badge--sm {
  padding: 0.125rem 0.5rem;
  font-size: 0.75rem;
}

.g-badge--md {
  padding: 0.25rem 0.75rem;
  font-size: 0.875rem;
}

.g-badge--default {
  background-color: var(--color-secondary, #e5e7eb);
  color: var(--color-text, #374151);
}

.g-badge--success {
  background-color: var(--color-success-light, #dcfce7);
  color: var(--color-success, #16a34a);
}

.g-badge--warning {
  background-color: var(--color-warning-light, #fef3c7);
  color: var(--color-warning, #d97706);
}

.g-badge--danger {
  background-color: var(--color-danger-light, #fee2e2);
  color: var(--color-danger, #dc2626);
}

.g-badge--info {
  background-color: var(--color-info-light, #dbeafe);
  color: var(--color-info, #2563eb);
}
</style>
