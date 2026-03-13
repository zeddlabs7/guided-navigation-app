<script setup lang="ts">
interface Props {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: boolean;
  clickable?: boolean;
}

withDefaults(defineProps<Props>(), {
  padding: 'md',
  shadow: true,
  clickable: false,
});
</script>

<template>
  <div
    :class="[
      'g-card',
      `g-card--padding-${padding}`,
      { 'g-card--shadow': shadow },
      { 'g-card--clickable': clickable },
    ]"
  >
    <slot />
  </div>
</template>

<style scoped>
.g-card {
  background-color: var(--color-surface, #ffffff);
  border-radius: 0.75rem;
  border: 1px solid var(--color-border, #e5e7eb);
}

.g-card--shadow {
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
}

.g-card--clickable {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.g-card--clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
}

.g-card--padding-none {
  padding: 0;
}

.g-card--padding-sm {
  padding: 0.75rem;
}

.g-card--padding-md {
  padding: 1rem;
}

.g-card--padding-lg {
  padding: 1.5rem;
}
</style>
