<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';

export interface StepTypeOption {
  type: string;
  label: string;
  orderHint: string;
  orderIndex: number;
}

interface Props {
  modelValue: string;
  options: StepTypeOption[];
  suggestedType?: string | null;
  disabled?: boolean;
  label?: string;
}

const props = withDefaults(defineProps<Props>(), {
  suggestedType: null,
  disabled: false,
  label: 'Step Type',
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const isOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);
const listRef = ref<HTMLElement | null>(null);
const focusedIndex = ref(-1);

const selectedOption = computed(() => {
  return props.options.find(o => o.type === props.modelValue) || null;
});

const getTypeColor = (type: string) => {
  const colors: Record<string, { bg: string; border: string; text: string }> = {
    LOCATION_CHECK: { bg: '#fffbeb', border: '#fcd34d', text: '#b45309' },
    LANDMARK_REFERENCE: { bg: '#f3f4f6', border: '#d1d5db', text: '#4b5563' },
    PARKING_LOCATION: { bg: '#ecfdf5', border: '#6ee7b7', text: '#047857' },
    BUILDING_ENTRY: { bg: '#eff6ff', border: '#93c5fd', text: '#1d4ed8' },
    RECEPTION_OR_SECURITY: { bg: '#faf5ff', border: '#d8b4fe', text: '#7c3aed' },
    LOBBY_NAVIGATION: { bg: '#f3f4f6', border: '#d1d5db', text: '#4b5563' },
    ELEVATOR_ENTRY: { bg: '#faf5ff', border: '#d8b4fe', text: '#7c3aed' },
    STAIRS_ENTRY: { bg: '#f3f4f6', border: '#d1d5db', text: '#4b5563' },
    FLOOR_NUMBER: { bg: '#eff6ff', border: '#93c5fd', text: '#1d4ed8' },
    CORRIDOR_OR_PATH: { bg: '#f3f4f6', border: '#d1d5db', text: '#4b5563' },
    DOOR_IDENTIFICATION: { bg: '#eff6ff', border: '#93c5fd', text: '#1d4ed8' },
    DROP_OFF_POINT: { bg: '#f0fdf4', border: '#86efac', text: '#15803d' },
    GATE_ENTRY: { bg: '#ecfdf5', border: '#6ee7b7', text: '#047857' },
    UNIT_OR_DOOR_IDENTIFICATION: { bg: '#eff6ff', border: '#93c5fd', text: '#1d4ed8' },
    FLOOR_NAVIGATION: { bg: '#f3f4f6', border: '#d1d5db', text: '#4b5563' },
    OTHER: { bg: '#f3f4f6', border: '#d1d5db', text: '#4b5563' },
  };
  return colors[type] || { bg: '#f3f4f6', border: '#d1d5db', text: '#4b5563' };
};

function toggleDropdown() {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    focusedIndex.value = props.options.findIndex(o => o.type === props.modelValue);
  }
}

function closeDropdown() {
  isOpen.value = false;
  focusedIndex.value = -1;
}

function selectOption(option: StepTypeOption) {
  emit('update:modelValue', option.type);
  closeDropdown();
}

function handleKeydown(event: KeyboardEvent) {
  if (!isOpen.value) {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
      event.preventDefault();
      toggleDropdown();
    }
    return;
  }

  switch (event.key) {
    case 'Escape':
      event.preventDefault();
      closeDropdown();
      break;
    case 'ArrowDown':
      event.preventDefault();
      focusedIndex.value = Math.min(focusedIndex.value + 1, props.options.length - 1);
      scrollToFocused();
      break;
    case 'ArrowUp':
      event.preventDefault();
      focusedIndex.value = Math.max(focusedIndex.value - 1, 0);
      scrollToFocused();
      break;
    case 'Enter':
    case ' ':
      event.preventDefault();
      if (focusedIndex.value >= 0) {
        selectOption(props.options[focusedIndex.value]);
      }
      break;
    case 'Tab':
      closeDropdown();
      break;
  }
}

function scrollToFocused() {
  if (!listRef.value || focusedIndex.value < 0) return;
  const items = listRef.value.querySelectorAll('.dropdown-option');
  const focusedItem = items[focusedIndex.value] as HTMLElement;
  if (focusedItem) {
    focusedItem.scrollIntoView({ block: 'nearest' });
  }
}

function handleClickOutside(event: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    closeDropdown();
  }
}

watch(isOpen, (open) => {
  if (open) {
    document.addEventListener('click', handleClickOutside);
  } else {
    document.removeEventListener('click', handleClickOutside);
  }
});

onMounted(() => {
  if (isOpen.value) {
    document.addEventListener('click', handleClickOutside);
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
  <div class="step-type-dropdown" ref="dropdownRef">
    <label v-if="label" class="dropdown-label">{{ label }}</label>
    
    <button
      type="button"
      class="dropdown-trigger"
      :class="{ 'dropdown-trigger--open': isOpen, 'dropdown-trigger--disabled': disabled }"
      :disabled="disabled"
      :aria-expanded="isOpen"
      aria-haspopup="listbox"
      @click="toggleDropdown"
      @keydown="handleKeydown"
    >
      <div class="dropdown-trigger__content">
        <div 
          v-if="selectedOption"
          class="dropdown-trigger__badge"
          :style="{
            backgroundColor: getTypeColor(selectedOption.type).bg,
            borderColor: getTypeColor(selectedOption.type).border,
            color: getTypeColor(selectedOption.type).text,
          }"
        >
          <span class="dropdown-trigger__label">{{ selectedOption.label }}</span>
          <span v-if="selectedOption.orderHint" class="dropdown-trigger__hint">
            {{ selectedOption.orderHint }}
          </span>
        </div>
        <span v-else class="dropdown-trigger__placeholder">Select step type</span>
      </div>
      
      <svg 
        class="dropdown-trigger__icon"
        :class="{ 'dropdown-trigger__icon--open': isOpen }"
        width="20" 
        height="20" 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
    
    <Transition name="dropdown">
      <div 
        v-if="isOpen" 
        class="dropdown-menu"
        role="listbox"
        ref="listRef"
      >
        <div class="dropdown-menu__hint">Hints show typical delivery order</div>
        
        <button
          v-for="(option, index) in options"
          :key="option.type"
          type="button"
          class="dropdown-option"
          :class="{
            'dropdown-option--selected': modelValue === option.type,
            'dropdown-option--suggested': suggestedType === option.type && modelValue !== option.type,
            'dropdown-option--focused': focusedIndex === index,
          }"
          role="option"
          :aria-selected="modelValue === option.type"
          @click="selectOption(option)"
          @mouseenter="focusedIndex = index"
        >
          <div class="dropdown-option__main">
            <span class="dropdown-option__label">{{ option.label }}</span>
            <span v-if="option.orderHint" class="dropdown-option__hint">{{ option.orderHint }}</span>
          </div>
          
          <svg 
            v-if="modelValue === option.type" 
            class="dropdown-option__check"
            width="18" 
            height="18" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span 
            v-else-if="suggestedType === option.type"
            class="dropdown-option__tag"
          >
            Suggested
          </span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.step-type-dropdown {
  position: relative;
  width: 100%;
}

.dropdown-label {
  display: block;
  margin-bottom: 6px;
  font-size: var(--font-size-sm, 0.875rem);
  font-weight: var(--font-weight-medium, 500);
  color: var(--color-text-secondary, #6b7280);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.dropdown-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 12px 16px;
  background-color: var(--color-surface, #ffffff);
  border: 1px solid var(--color-border, #d1d5db);
  border-radius: var(--radius-lg, 0.75rem);
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.dropdown-trigger:hover:not(:disabled) {
  border-color: var(--color-border-dark, #9ca3af);
}

.dropdown-trigger:focus {
  outline: none;
  border-color: var(--color-primary, #2563eb);
  box-shadow: 0 0 0 3px var(--color-primary-light, rgba(37, 99, 235, 0.1));
}

.dropdown-trigger--open {
  border-color: var(--color-primary, #2563eb);
  box-shadow: 0 0 0 3px var(--color-primary-light, rgba(37, 99, 235, 0.1));
}

.dropdown-trigger--disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: var(--color-background, #f9fafb);
}

.dropdown-trigger__content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.dropdown-trigger__badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border: 2px solid;
  border-radius: var(--radius-md, 0.5rem);
  font-weight: var(--font-weight-semibold, 600);
}

.dropdown-trigger__label {
  font-size: var(--font-size-sm, 0.875rem);
}

.dropdown-trigger__hint {
  font-size: 10px;
  font-weight: var(--font-weight-medium, 500);
  padding: 2px 6px;
  background-color: rgba(0, 0, 0, 0.08);
  border-radius: var(--radius-sm, 0.25rem);
}

.dropdown-trigger__placeholder {
  color: var(--color-text-light, #9ca3af);
  font-size: var(--font-size-sm, 0.875rem);
}

.dropdown-trigger__icon {
  flex-shrink: 0;
  color: var(--color-text-muted, #9ca3af);
  transition: transform 0.2s ease;
}

.dropdown-trigger__icon--open {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 50;
  background-color: var(--color-surface, #ffffff);
  border: 1px solid var(--color-border, #d1d5db);
  border-radius: var(--radius-lg, 0.75rem);
  box-shadow: var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05));
  overflow: hidden;
  max-height: 320px;
  overflow-y: auto;
}

.dropdown-menu__hint {
  padding: 8px 16px;
  font-size: var(--font-size-xs, 0.75rem);
  color: var(--color-text-muted, #9ca3af);
  background-color: var(--color-background, #f9fafb);
  border-bottom: 1px solid var(--color-border-light, #e5e7eb);
}

.dropdown-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 12px 16px;
  background: none;
  border: none;
  border-bottom: 1px solid var(--color-border-light, #e5e7eb);
  cursor: pointer;
  transition: background-color 0.1s ease;
  text-align: left;
}

.dropdown-option:last-child {
  border-bottom: none;
}

.dropdown-option:hover,
.dropdown-option--focused {
  background-color: var(--color-background, #f9fafb);
}

.dropdown-option--selected {
  background-color: var(--color-primary-bg, #eff6ff);
}

.dropdown-option--selected:hover,
.dropdown-option--selected.dropdown-option--focused {
  background-color: var(--color-primary-bg, #eff6ff);
}

.dropdown-option--suggested {
  background-color: #fffbeb;
}

.dropdown-option--suggested:hover,
.dropdown-option--suggested.dropdown-option--focused {
  background-color: #fef3c7;
}

.dropdown-option__main {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dropdown-option__label {
  font-size: var(--font-size-sm, 0.875rem);
  font-weight: var(--font-weight-medium, 500);
  color: var(--color-text, #1f2937);
}

.dropdown-option__hint {
  font-size: 10px;
  font-weight: var(--font-weight-medium, 500);
  color: var(--color-text-muted, #9ca3af);
  padding: 2px 8px;
  background-color: var(--color-background, #f9fafb);
  border-radius: var(--radius-sm, 0.25rem);
}

.dropdown-option--selected .dropdown-option__hint {
  background-color: rgba(0, 0, 0, 0.06);
}

.dropdown-option__check {
  color: var(--color-primary, #2563eb);
  flex-shrink: 0;
}

.dropdown-option__tag {
  font-size: 10px;
  font-weight: var(--font-weight-semibold, 600);
  color: #b45309;
  background-color: #fef3c7;
  padding: 3px 8px;
  border-radius: var(--radius-sm, 0.25rem);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

/* Dropdown animation */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
