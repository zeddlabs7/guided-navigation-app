<script setup lang="ts">
import { ref } from 'vue';
import type { OverlayType, ArrowDirection } from '@guidenav/types';

interface Props {
  overlayType: OverlayType;
  arrowDirection?: ArrowDirection;
  hasLabel?: boolean;
  visible: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  'change-direction': [direction: ArrowDirection];
  'edit-label': [];
  'delete': [];
  'done': [];
}>();

const showDirectionPicker = ref(false);

const directions: { value: ArrowDirection; label: string; icon: string }[] = [
  { value: 'left', label: 'Left', icon: '↰' },
  { value: 'right', label: 'Right', icon: '↱' },
  { value: 'up-down', label: 'Up/Down', icon: '↕' },
  { value: 'forward-backward', label: 'Forward/Back', icon: '⬆' },
];

function selectDirection(direction: ArrowDirection) {
  emit('change-direction', direction);
  showDirectionPicker.value = false;
}

function toggleDirectionPicker() {
  showDirectionPicker.value = !showDirectionPicker.value;
}

function getDirectionLabel(direction?: ArrowDirection): string {
  const found = directions.find(d => d.value === direction);
  return found ? found.icon : '↑';
}
</script>

<template>
  <Transition name="toolbar">
    <div v-if="visible" class="overlay-toolbar">
      <template v-if="overlayType === 'arrow'">
        <div class="direction-picker-wrapper">
          <button
            class="overlay-toolbar__btn overlay-toolbar__btn--direction"
            title="Change direction"
            @click="toggleDirectionPicker"
          >
            <span class="overlay-toolbar__direction-icon">{{ getDirectionLabel(arrowDirection) }}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          
          <Transition name="picker">
            <div v-if="showDirectionPicker" class="direction-picker">
              <button
                v-for="dir in directions"
                :key="dir.value"
                class="direction-picker__option"
                :class="{ 'direction-picker__option--selected': arrowDirection === dir.value }"
                @click="selectDirection(dir.value)"
              >
                <span class="direction-picker__icon">{{ dir.icon }}</span>
                <span class="direction-picker__label">{{ dir.label }}</span>
              </button>
            </div>
          </Transition>
        </div>
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

.overlay-toolbar__btn--direction {
  width: auto;
  min-width: 56px;
  padding: 0 10px;
  gap: 4px;
  background-color: #fef3c7;
  border: 1px solid #fcd34d;
  color: #92400e;
}

.overlay-toolbar__btn--direction:hover {
  background-color: #fde68a;
  border-color: #fbbf24;
}

.overlay-toolbar__direction-icon {
  font-size: 18px;
  line-height: 1;
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

.direction-picker-wrapper {
  position: relative;
}

.direction-picker {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 8px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px;
  padding: 8px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  min-width: 160px;
}

.direction-picker__option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: none;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
}

.direction-picker__option:hover {
  background-color: #f3f4f6;
}

.direction-picker__option--selected {
  background-color: #fef3c7;
}

.direction-picker__option--selected:hover {
  background-color: #fde68a;
}

.direction-picker__icon {
  font-size: 16px;
  width: 20px;
  text-align: center;
}

.direction-picker__label {
  font-size: 13px;
  font-weight: 500;
  color: #101828;
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

.picker-enter-active,
.picker-leave-active {
  transition: all 0.15s ease;
}

.picker-enter-from,
.picker-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(4px);
}
</style>
