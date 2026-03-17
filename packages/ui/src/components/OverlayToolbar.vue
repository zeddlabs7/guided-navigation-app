<script setup lang="ts">
import type { OverlayType, ArrowStyle } from '@guidenav/types';

interface Props {
  overlayType: OverlayType;
  arrowStyle?: ArrowStyle;
  hasLabel?: boolean;
  visible: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  'rotate-left': [];
  'rotate-right': [];
  'toggle-style': [];
  'edit-label': [];
  'delete': [];
  'done': [];
}>();
</script>

<template>
  <Transition name="toolbar">
    <div v-if="visible" class="overlay-toolbar">
      <template v-if="overlayType === 'arrow'">
        <button
          class="overlay-toolbar__btn"
          title="Rotate left"
          @click="emit('rotate-left')"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 4V10H7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M3.51 15C4.15 16.82 5.36 18.38 6.96 19.45C8.56 20.53 10.45 21.06 12.37 20.98C14.29 20.89 16.14 20.19 17.66 18.97C19.17 17.76 20.27 16.09 20.79 14.2C21.32 12.32 21.25 10.32 20.6 8.48C19.95 6.64 18.75 5.06 17.17 3.96C15.59 2.86 13.72 2.29 11.81 2.34C9.89 2.38 8.05 3.03 6.51 4.19L1 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        
        <button
          class="overlay-toolbar__btn"
          title="Rotate right"
          @click="emit('rotate-right')"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M23 4V10H17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M20.49 15C19.85 16.82 18.64 18.38 17.04 19.45C15.44 20.53 13.55 21.06 11.63 20.98C9.71 20.89 7.86 20.19 6.34 18.97C4.83 17.76 3.73 16.09 3.21 14.2C2.68 12.32 2.75 10.32 3.4 8.48C4.05 6.64 5.25 5.06 6.83 3.96C8.41 2.86 10.28 2.29 12.19 2.34C14.11 2.38 15.95 3.03 17.49 4.19L23 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        
        <div class="overlay-toolbar__divider" />
        
        <button
          class="overlay-toolbar__btn overlay-toolbar__btn--style"
          :class="{ 'overlay-toolbar__btn--style-3d': arrowStyle === '3d' }"
          title="Toggle 2D/3D style"
          @click="emit('toggle-style')"
        >
          <span class="overlay-toolbar__style-label">{{ arrowStyle === '3d' ? '3D' : '2D' }}</span>
        </button>
      </template>
      
      <template v-else-if="overlayType === 'marker'">
        <button
          class="overlay-toolbar__btn overlay-toolbar__btn--label"
          :title="hasLabel ? 'Edit label' : 'Add label'"
          @click="emit('edit-label')"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="overlay-toolbar__btn-text">{{ hasLabel ? 'Edit' : 'Add Label' }}</span>
        </button>
      </template>
      
      <div class="overlay-toolbar__divider" />
      
      <button
        class="overlay-toolbar__btn overlay-toolbar__btn--danger"
        title="Delete"
        @click="emit('delete')"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 6H5H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      
      <div class="overlay-toolbar__divider" />
      
      <button
        class="overlay-toolbar__btn overlay-toolbar__btn--done"
        title="Done"
        @click="emit('done')"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.overlay-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.overlay-toolbar__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: none;
  border: none;
  border-radius: 8px;
  color: #4a5565;
  cursor: pointer;
  transition: all 0.15s ease;
}

.overlay-toolbar__btn:hover {
  background-color: #f3f4f6;
  color: #101828;
}

.overlay-toolbar__btn:active {
  background-color: #e5e7eb;
}

.overlay-toolbar__btn--danger:hover {
  background-color: #fee2e2;
  color: #dc2626;
}

.overlay-toolbar__btn--done {
  color: #155dfc;
}

.overlay-toolbar__btn--done:hover {
  background-color: #eff6ff;
  color: #1249d6;
}

.overlay-toolbar__btn--style {
  width: auto;
  min-width: 44px;
  padding: 0 12px;
  background-color: #f3f4f6;
  border: 1px solid #e5e7eb;
}

.overlay-toolbar__btn--style:hover {
  background-color: #e5e7eb;
  border-color: #d1d5db;
}

.overlay-toolbar__btn--style-3d {
  background-color: #fef3c7;
  border-color: #fcd34d;
  color: #92400e;
}

.overlay-toolbar__btn--style-3d:hover {
  background-color: #fde68a;
  border-color: #fbbf24;
}

.overlay-toolbar__style-label {
  font-size: 13px;
  font-weight: 600;
}

.overlay-toolbar__btn--label {
  width: auto;
  gap: 6px;
  padding: 0 12px;
}

.overlay-toolbar__btn-text {
  font-size: 13px;
  font-weight: 500;
}

.overlay-toolbar__divider {
  width: 1px;
  height: 24px;
  background-color: #e5e7eb;
  margin: 0 4px;
}

.toolbar-enter-active,
.toolbar-leave-active {
  transition: all 0.2s ease;
}

.toolbar-enter-from,
.toolbar-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
