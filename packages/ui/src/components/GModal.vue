<script setup lang="ts">
interface Props {
  open: boolean;
  title?: string;
  closable?: boolean;
}

withDefaults(defineProps<Props>(), {
  title: '',
  closable: true,
});

const emit = defineEmits<{
  close: [];
}>();

function handleClose() {
  emit('close');
}

function handleBackdropClick(event: MouseEvent) {
  if (event.target === event.currentTarget) {
    handleClose();
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="g-modal-backdrop" @click="handleBackdropClick">
        <div class="g-modal">
          <div v-if="title || closable" class="g-modal__header">
            <h2 v-if="title" class="g-modal__title">{{ title }}</h2>
            <button v-if="closable" class="g-modal__close" @click="handleClose">
              <span>×</span>
            </button>
          </div>
          <div class="g-modal__body">
            <slot />
          </div>
          <div v-if="$slots.footer" class="g-modal__footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.g-modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 1000;
}

.g-modal {
  background-color: var(--color-surface, #ffffff);
  border-radius: 0.75rem;
  max-width: 32rem;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.g-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}

.g-modal__title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
  color: var(--color-text, #1f2937);
}

.g-modal__close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--color-text-muted, #6b7280);
  cursor: pointer;
  padding: 0.25rem;
  line-height: 1;
}

.g-modal__close:hover {
  color: var(--color-text, #1f2937);
}

.g-modal__body {
  padding: 1.5rem;
  overflow-y: auto;
}

.g-modal__footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--color-border, #e5e7eb);
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .g-modal,
.modal-leave-active .g-modal {
  transition: transform 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .g-modal,
.modal-leave-to .g-modal {
  transform: scale(0.95);
}
</style>
