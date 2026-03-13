<script setup lang="ts">
interface Props {
  modelValue: string;
  type?: 'text' | 'email' | 'tel' | 'password' | 'number';
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
}

withDefaults(defineProps<Props>(), {
  type: 'text',
  placeholder: '',
  label: '',
  error: '',
  disabled: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
}
</script>

<template>
  <div class="g-input-wrapper">
    <label v-if="label" class="g-input__label">{{ label }}</label>
    <input
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :class="['g-input', { 'g-input--error': error }]"
      @input="handleInput"
    />
    <span v-if="error" class="g-input__error">{{ error }}</span>
  </div>
</template>

<style scoped>
.g-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.g-input__label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text, #374151);
}

.g-input {
  padding: 0.75rem 1rem;
  font-size: 1rem;
  border: 1px solid var(--color-border, #d1d5db);
  border-radius: 0.5rem;
  background-color: var(--color-surface, #ffffff);
  color: var(--color-text, #1f2937);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.g-input:focus {
  outline: none;
  border-color: var(--color-primary, #2563eb);
  box-shadow: 0 0 0 3px var(--color-primary-light, rgba(37, 99, 235, 0.1));
}

.g-input:disabled {
  background-color: var(--color-disabled, #f3f4f6);
  cursor: not-allowed;
}

.g-input--error {
  border-color: var(--color-danger, #dc2626);
}

.g-input--error:focus {
  box-shadow: 0 0 0 3px var(--color-danger-light, rgba(220, 38, 38, 0.1));
}

.g-input__error {
  font-size: 0.75rem;
  color: var(--color-danger, #dc2626);
}
</style>
