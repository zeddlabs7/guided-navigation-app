<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';

interface Props {
  length?: number;
  disabled?: boolean;
  error?: string;
}

const props = withDefaults(defineProps<Props>(), {
  length: 6,
  disabled: false,
  error: '',
});

const emit = defineEmits<{
  complete: [code: string];
  'update:modelValue': [code: string];
}>();

const digits = ref<string[]>(Array(props.length).fill(''));
const inputRefs = ref<HTMLInputElement[]>([]);

function setInputRef(el: HTMLInputElement | null, index: number) {
  if (el) {
    inputRefs.value[index] = el;
  }
}

function focusInput(index: number) {
  nextTick(() => {
    if (inputRefs.value[index]) {
      inputRefs.value[index].focus();
      inputRefs.value[index].select();
    }
  });
}

function handleInput(index: number, event: Event) {
  const target = event.target as HTMLInputElement;
  const value = target.value;
  
  // Only allow digits
  const digit = value.replace(/\D/g, '').slice(-1);
  digits.value[index] = digit;
  
  emitValue();
  
  if (digit && index < props.length - 1) {
    focusInput(index + 1);
  }
  
  // Check if complete
  const code = digits.value.join('');
  if (code.length === props.length && !code.includes('')) {
    emit('complete', code);
  }
}

function handleKeydown(index: number, event: KeyboardEvent) {
  if (event.key === 'Backspace') {
    if (!digits.value[index] && index > 0) {
      focusInput(index - 1);
    } else {
      digits.value[index] = '';
      emitValue();
    }
  } else if (event.key === 'ArrowLeft' && index > 0) {
    focusInput(index - 1);
  } else if (event.key === 'ArrowRight' && index < props.length - 1) {
    focusInput(index + 1);
  }
}

function handlePaste(event: ClipboardEvent) {
  event.preventDefault();
  const pastedData = event.clipboardData?.getData('text') || '';
  const pastedDigits = pastedData.replace(/\D/g, '').slice(0, props.length);
  
  for (let i = 0; i < props.length; i++) {
    digits.value[i] = pastedDigits[i] || '';
  }
  
  emitValue();
  
  // Focus the next empty input or the last one
  const nextEmptyIndex = digits.value.findIndex(d => !d);
  if (nextEmptyIndex !== -1) {
    focusInput(nextEmptyIndex);
  } else {
    focusInput(props.length - 1);
    // All filled, emit complete
    const code = digits.value.join('');
    if (code.length === props.length) {
      emit('complete', code);
    }
  }
}

function emitValue() {
  emit('update:modelValue', digits.value.join(''));
}

function clear() {
  digits.value = Array(props.length).fill('');
  emitValue();
  focusInput(0);
}

onMounted(() => {
  focusInput(0);
});

defineExpose({ clear, focusInput });
</script>

<template>
  <div class="otp-input-wrapper">
    <div class="otp-input-container">
      <input
        v-for="(_, index) in length"
        :key="index"
        :ref="(el) => setInputRef(el as HTMLInputElement, index)"
        type="text"
        inputmode="numeric"
        pattern="[0-9]*"
        maxlength="1"
        :value="digits[index]"
        :disabled="disabled"
        :class="['otp-input', { 'otp-input--error': error, 'otp-input--filled': digits[index] }]"
        @input="handleInput(index, $event)"
        @keydown="handleKeydown(index, $event)"
        @paste="handlePaste"
      />
    </div>
    <span v-if="error" class="otp-input__error">{{ error }}</span>
  </div>
</template>

<style scoped>
.otp-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.otp-input-container {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.otp-input {
  width: 3rem;
  height: 3.5rem;
  text-align: center;
  font-size: 1.5rem;
  font-weight: 600;
  border: 2px solid var(--color-border, #d1d5db);
  border-radius: 0.5rem;
  background-color: var(--color-surface, #ffffff);
  color: var(--color-text, #1f2937);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.1s ease;
}

.otp-input:focus {
  outline: none;
  border-color: var(--color-primary, #2563eb);
  box-shadow: 0 0 0 3px var(--color-primary-light, rgba(37, 99, 235, 0.1));
  transform: scale(1.05);
}

.otp-input--filled {
  border-color: var(--color-primary, #2563eb);
  background-color: var(--color-primary-light, rgba(37, 99, 235, 0.05));
}

.otp-input:disabled {
  background-color: var(--color-disabled, #f3f4f6);
  cursor: not-allowed;
}

.otp-input--error {
  border-color: var(--color-danger, #dc2626);
}

.otp-input--error:focus {
  box-shadow: 0 0 0 3px var(--color-danger-light, rgba(220, 38, 38, 0.1));
}

.otp-input__error {
  font-size: 0.875rem;
  color: var(--color-danger, #dc2626);
  text-align: center;
}
</style>
