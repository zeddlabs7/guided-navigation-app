<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';

interface Props {
  visible: boolean;
  initialValue?: string;
  title?: string;
}

const props = withDefaults(defineProps<Props>(), {
  initialValue: '',
  title: 'Add Label',
});

const emit = defineEmits<{
  'update:visible': [value: boolean];
  save: [label: string];
  cancel: [];
}>();

const inputValue = ref(props.initialValue);
const inputRef = ref<HTMLInputElement | null>(null);

watch(() => props.visible, (isVisible) => {
  if (isVisible) {
    inputValue.value = props.initialValue;
    nextTick(() => {
      inputRef.value?.focus();
      inputRef.value?.select();
    });
  }
});

watch(() => props.initialValue, (newValue) => {
  inputValue.value = newValue;
});

function handleSave() {
  const trimmed = inputValue.value.trim();
  if (trimmed) {
    emit('save', trimmed);
    emit('update:visible', false);
  }
}

function handleCancel() {
  emit('cancel');
  emit('update:visible', false);
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    event.preventDefault();
    handleSave();
  } else if (event.key === 'Escape') {
    event.preventDefault();
    handleCancel();
  }
}

function handleBackdropClick(event: MouseEvent) {
  if (event.target === event.currentTarget) {
    handleCancel();
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible"
        class="label-modal-backdrop"
        @click="handleBackdropClick"
      >
        <div class="label-modal">
          <h3 class="label-modal__title">{{ title }}</h3>
          
          <input
            ref="inputRef"
            v-model="inputValue"
            type="text"
            class="label-modal__input"
            placeholder="e.g. PIN Keypad, Elevator Button"
            maxlength="50"
            @keydown="handleKeydown"
          />
          
          <div class="label-modal__actions">
            <button
              type="button"
              class="label-modal__btn label-modal__btn--cancel"
              @click="handleCancel"
            >
              Cancel
            </button>
            <button
              type="button"
              class="label-modal__btn label-modal__btn--save"
              :disabled="!inputValue.trim()"
              @click="handleSave"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.label-modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.label-modal {
  background-color: white;
  border-radius: 16px;
  padding: 24px;
  width: 100%;
  max-width: 320px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.label-modal__title {
  margin: 0 0 16px;
  font-size: 18px;
  font-weight: 600;
  color: #101828;
}

.label-modal__input {
  width: 100%;
  padding: 12px 16px;
  font-size: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.label-modal__input:focus {
  border-color: #155dfc;
  box-shadow: 0 0 0 3px rgba(21, 93, 252, 0.1);
}

.label-modal__input::placeholder {
  color: #99a1af;
}

.label-modal__actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.label-modal__btn {
  flex: 1;
  padding: 12px 16px;
  font-size: 15px;
  font-weight: 500;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.label-modal__btn--cancel {
  background-color: white;
  border: 1px solid #e5e7eb;
  color: #4a5565;
}

.label-modal__btn--cancel:hover {
  background-color: #f9fafb;
  border-color: #d1d5db;
}

.label-modal__btn--save {
  background-color: #155dfc;
  border: none;
  color: white;
}

.label-modal__btn--save:hover:not(:disabled) {
  background-color: #1249d6;
}

.label-modal__btn--save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .label-modal,
.modal-leave-active .label-modal {
  transition: transform 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .label-modal,
.modal-leave-to .label-modal {
  transform: scale(0.95);
}
</style>
