<script setup lang="ts">
interface Props {
  size?: 'sm' | 'md' | 'lg';
}

withDefaults(defineProps<Props>(), {
  size: 'md',
});
</script>

<template>
  <div :class="['g-spinner', `g-spinner--${size}`]" />
</template>

<style scoped>
.g-spinner {
  border-radius: 50%;
  border: 2px solid var(--color-border, #e5e7eb);
  border-top-color: var(--color-primary, #2563eb);
  animation: spin 0.75s linear infinite;
}

.g-spinner--sm {
  width: 1rem;
  height: 1rem;
}

.g-spinner--md {
  width: 1.5rem;
  height: 1.5rem;
}

.g-spinner--lg {
  width: 2.5rem;
  height: 2.5rem;
  border-width: 3px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
