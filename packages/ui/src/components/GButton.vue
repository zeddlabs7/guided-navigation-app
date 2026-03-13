<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  loading: false,
  disabled: false,
  fullWidth: false,
});

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

function handleClick(event: MouseEvent) {
  if (!props.disabled && !props.loading) {
    emit('click', event);
  }
}
</script>

<template>
  <button
    :class="[
      'g-button',
      `g-button--${variant}`,
      `g-button--${size}`,
      { 'g-button--loading': loading },
      { 'g-button--full-width': fullWidth },
    ]"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <span v-if="loading" class="g-button__spinner" />
    <span :class="{ 'g-button__content--hidden': loading }">
      <slot />
    </span>
  </button>
</template>

<style scoped>
.g-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.g-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.g-button--sm {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.g-button--md {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
}

.g-button--lg {
  padding: 1rem 2rem;
  font-size: 1.125rem;
}

.g-button--primary {
  background-color: var(--color-primary, #2563eb);
  color: white;
}

.g-button--primary:hover:not(:disabled) {
  background-color: var(--color-primary-dark, #1d4ed8);
}

.g-button--secondary {
  background-color: var(--color-secondary, #e5e7eb);
  color: var(--color-text, #1f2937);
}

.g-button--secondary:hover:not(:disabled) {
  background-color: var(--color-secondary-dark, #d1d5db);
}

.g-button--danger {
  background-color: var(--color-danger, #dc2626);
  color: white;
}

.g-button--danger:hover:not(:disabled) {
  background-color: var(--color-danger-dark, #b91c1c);
}

.g-button--ghost {
  background-color: transparent;
  color: var(--color-primary, #2563eb);
}

.g-button--ghost:hover:not(:disabled) {
  background-color: var(--color-primary-light, #eff6ff);
}

.g-button--full-width {
  width: 100%;
}

.g-button__spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
  position: absolute;
}

.g-button__content--hidden {
  visibility: hidden;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
