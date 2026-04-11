<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { Overlay, ArrowDirection } from '@guidenav/types';
import OverlayCanvas from './OverlayCanvas.vue';
import OverlayToolbar from './OverlayToolbar.vue';
import LabelInputModal from './LabelInputModal.vue';
import OverlayTutorial from './OverlayTutorial.vue';
import { useOverlayTutorials, useIsMobile, type OverlayTutorialType } from '../composables/useTutorialState';

type EditorMode = 'view' | 'add-arrow' | 'add-marker' | 'select';

interface Props {
  imageUrl: string;
  overlays: Overlay[];
  readonly?: boolean;
  userId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  userId: 'dev-user-placeholder',
});

const emit = defineEmits<{
  'update:overlays': [overlays: Overlay[]];
}>();

const mode = ref<EditorMode>('view');
const selectedOverlayId = ref<string | null>(null);
const showLabelModal = ref(false);
const pendingMarkerPosition = ref<{ x: number; y: number } | null>(null);
const editingLabelOverlayId = ref<string | null>(null);

const { 
  hasSeenArrowTutorial, 
  hasSeenMarkerTutorial, 
  markArrowTutorialSeen, 
  markMarkerTutorialSeen 
} = useOverlayTutorials(props.userId);
const { isMobile } = useIsMobile();
const showTutorial = ref(false);
const tutorialType = ref<OverlayTutorialType>('arrow');

const showArrowTypePicker = ref(false);
const pendingArrowDirection = ref<ArrowDirection>('up-down');

const hasArrow = computed(() => props.overlays.some(o => o.type === 'arrow'));
const hasMarker = computed(() => props.overlays.some(o => o.type === 'marker'));

const selectedOverlay = computed(() => {
  if (!selectedOverlayId.value) return null;
  return props.overlays.find(o => o.id === selectedOverlayId.value) ?? null;
});

const labelModalTitle = computed(() => {
  if (editingLabelOverlayId.value) {
    const overlay = props.overlays.find(o => o.id === editingLabelOverlayId.value);
    return overlay?.label ? 'Edit Label' : 'Add Label';
  }
  return 'Add Label';
});

const labelModalInitialValue = computed(() => {
  if (editingLabelOverlayId.value) {
    const overlay = props.overlays.find(o => o.id === editingLabelOverlayId.value);
    return overlay?.label ?? '';
  }
  return '';
});

const arrowDirections: { value: ArrowDirection; label: string; icon: string }[] = [
  { value: 'left', label: 'Left', icon: '↰' },
  { value: 'right', label: 'Right', icon: '↱' },
  { value: 'up-down', label: 'Up/Down', icon: '↕' },
  { value: 'forward-backward', label: 'Forward/Back', icon: '⬆' },
];

function generateId(): string {
  return `overlay-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function handleAddArrowClick() {
  if (props.readonly) return;
  
  if (mode.value === 'add-arrow') {
    mode.value = 'view';
    showArrowTypePicker.value = false;
    return;
  }
  
  showArrowTypePicker.value = true;
  selectedOverlayId.value = null;
}

function handleArrowTypeSelect(direction: ArrowDirection) {
  pendingArrowDirection.value = direction;
  showArrowTypePicker.value = false;
  mode.value = 'add-arrow';
}

function handleArrowTypePickerCancel() {
  showArrowTypePicker.value = false;
}

function handleAddMarkerClick() {
  if (props.readonly) return;
  
  mode.value = mode.value === 'add-marker' ? 'view' : 'add-marker';
  selectedOverlayId.value = null;
}

function handleTutorialComplete() {
  if (tutorialType.value === 'arrow') {
    markArrowTutorialSeen();
  } else {
    markMarkerTutorialSeen();
  }
  showTutorial.value = false;
}

function handleTutorialSkip() {
  if (tutorialType.value === 'arrow') {
    markArrowTutorialSeen();
  } else {
    markMarkerTutorialSeen();
  }
  showTutorial.value = false;
}

function handleSelectOverlay(id: string | null) {
  selectedOverlayId.value = id;
  if (id) {
    mode.value = 'select';
  } else if (mode.value === 'select') {
    mode.value = 'view';
  }
}

function handleAddOverlay(x: number, y: number) {
  if (mode.value === 'add-arrow') {
    const newOverlay: Overlay = {
      id: generateId(),
      type: 'arrow',
      x,
      y,
      scale: 2,
      rotation: 0,
      label: null,
      arrowDirection: pendingArrowDirection.value,
    };
    const filteredOverlays = props.overlays.filter(o => o.type !== 'arrow');
    emit('update:overlays', [...filteredOverlays, newOverlay]);
    selectedOverlayId.value = newOverlay.id;
    mode.value = 'select';
    
    if (isMobile.value && !hasSeenArrowTutorial.value) {
      tutorialType.value = 'arrow';
      showTutorial.value = true;
    }
  }
}

function handleCanvasTap(x: number, y: number) {
  if (mode.value === 'add-marker') {
    const newOverlay: Overlay = {
      id: generateId(),
      type: 'marker',
      x,
      y,
      scale: 1,
      rotation: 0,
      label: null,
    };
    const filteredOverlays = props.overlays.filter(o => o.type !== 'marker');
    emit('update:overlays', [...filteredOverlays, newOverlay]);
    selectedOverlayId.value = newOverlay.id;
    mode.value = 'select';
    
    if (isMobile.value && !hasSeenMarkerTutorial.value) {
      tutorialType.value = 'marker';
      showTutorial.value = true;
    }
  }
}

function handleLabelSave(label: string) {
  if (editingLabelOverlayId.value) {
    const updatedOverlays = props.overlays.map(o => 
      o.id === editingLabelOverlayId.value ? { ...o, label } : o
    );
    emit('update:overlays', updatedOverlays);
    editingLabelOverlayId.value = null;
  } else if (pendingMarkerPosition.value) {
    const newOverlay: Overlay = {
      id: generateId(),
      type: 'marker',
      x: pendingMarkerPosition.value.x,
      y: pendingMarkerPosition.value.y,
      scale: 1,
      rotation: 0,
      label,
    };
    const filteredOverlays = props.overlays.filter(o => o.type !== 'marker');
    emit('update:overlays', [...filteredOverlays, newOverlay]);
    selectedOverlayId.value = newOverlay.id;
    pendingMarkerPosition.value = null;
    mode.value = 'select';
  }
  showLabelModal.value = false;
}

function handleLabelCancel() {
  pendingMarkerPosition.value = null;
  editingLabelOverlayId.value = null;
  showLabelModal.value = false;
}

function handleUpdateOverlay(id: string, updates: Partial<Overlay>) {
  const updatedOverlays = props.overlays.map(o => 
    o.id === id ? { ...o, ...updates } : o
  );
  emit('update:overlays', updatedOverlays);
}

function handleChangeDirection(direction: ArrowDirection) {
  if (!selectedOverlayId.value) return;
  const overlay = props.overlays.find(o => o.id === selectedOverlayId.value);
  if (overlay && overlay.type === 'arrow') {
    handleUpdateOverlay(selectedOverlayId.value, { arrowDirection: direction });
  }
}

function handleEditLabel() {
  if (!selectedOverlayId.value) return;
  editingLabelOverlayId.value = selectedOverlayId.value;
  showLabelModal.value = true;
}

function handleDelete() {
  if (!selectedOverlayId.value) return;
  const updatedOverlays = props.overlays.filter(o => o.id !== selectedOverlayId.value);
  emit('update:overlays', updatedOverlays);
  selectedOverlayId.value = null;
  mode.value = 'view';
}

function handleDone() {
  selectedOverlayId.value = null;
  mode.value = 'view';
}

watch(() => props.readonly, (isReadonly) => {
  if (isReadonly) {
    mode.value = 'view';
    selectedOverlayId.value = null;
  }
});
</script>

<template>
  <div class="overlay-editor">
    <OverlayCanvas
      :image-url="imageUrl"
      :overlays="overlays"
      :selected-id="selectedOverlayId"
      :mode="mode"
      @select-overlay="handleSelectOverlay"
      @add-overlay="handleAddOverlay"
      @update-overlay="handleUpdateOverlay"
      @canvas-tap="handleCanvasTap"
    />
    
    <div v-if="!readonly" class="overlay-editor__controls">
      <div class="overlay-editor__add-buttons">
        <span class="overlay-editor__label">Overlay:</span>
        
        <div class="overlay-editor__arrow-btn-wrapper">
          <button
            class="overlay-editor__add-btn"
            :class="{ 'overlay-editor__add-btn--active': mode === 'add-arrow' || showArrowTypePicker }"
            @click="handleAddArrowClick"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            {{ hasArrow ? 'Replace Arrow' : 'Add Arrow' }}
          </button>
          
          <Transition name="arrow-picker">
            <div v-if="showArrowTypePicker" class="overlay-editor__arrow-picker">
              <div class="overlay-editor__arrow-picker-header">
                <span class="overlay-editor__arrow-picker-title">Choose arrow type</span>
                <button 
                  class="overlay-editor__arrow-picker-close"
                  @click="handleArrowTypePickerCancel"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>
              <div class="overlay-editor__arrow-picker-grid">
                <button
                  v-for="dir in arrowDirections"
                  :key="dir.value"
                  class="overlay-editor__arrow-picker-option"
                  @click="handleArrowTypeSelect(dir.value)"
                >
                  <span class="overlay-editor__arrow-picker-icon">{{ dir.icon }}</span>
                  <span class="overlay-editor__arrow-picker-label">{{ dir.label }}</span>
                </button>
              </div>
            </div>
          </Transition>
        </div>
        
        <button
          class="overlay-editor__add-btn"
          :class="{ 'overlay-editor__add-btn--active': mode === 'add-marker' }"
          @click="handleAddMarkerClick"
        >
          <span class="overlay-editor__marker-dot" />
          {{ hasMarker ? 'Replace Marker' : 'Add Marker' }}
        </button>
      </div>
      
      <div v-if="selectedOverlay" class="overlay-editor__toolbar-container">
        <OverlayToolbar
          :overlay-type="selectedOverlay.type"
          :arrow-direction="selectedOverlay.arrowDirection"
          :has-label="!!selectedOverlay.label"
          :visible="true"
          @change-direction="handleChangeDirection"
          @edit-label="handleEditLabel"
          @delete="handleDelete"
          @done="handleDone"
        />
      </div>
    </div>
    
    <LabelInputModal
      :visible="showLabelModal"
      :initial-value="labelModalInitialValue"
      :title="labelModalTitle"
      @update:visible="showLabelModal = $event"
      @save="handleLabelSave"
      @cancel="handleLabelCancel"
    />
    
    <OverlayTutorial
      :visible="showTutorial"
      :type="tutorialType"
      @complete="handleTutorialComplete"
      @skip="handleTutorialSkip"
    />
  </div>
</template>

<style scoped>
.overlay-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.overlay-editor__controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.overlay-editor__add-buttons {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.overlay-editor__label {
  font-size: 12px;
  color: #99a1af;
}

.overlay-editor__arrow-btn-wrapper {
  position: relative;
}

.overlay-editor__add-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 13px;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
  color: #4a5565;
  cursor: pointer;
  transition: all 0.15s ease;
}

.overlay-editor__add-btn:hover {
  border-color: #155dfc;
  color: #155dfc;
}

.overlay-editor__add-btn--active {
  background-color: #155dfc;
  border-color: #155dfc;
  color: white;
}

.overlay-editor__add-btn--active:hover {
  background-color: #1249d6;
  border-color: #1249d6;
  color: white;
}

.overlay-editor__marker-dot {
  width: 10px;
  height: 10px;
  background-color: #ff6467;
  border-radius: 50%;
}

.overlay-editor__add-btn--active .overlay-editor__marker-dot {
  background-color: white;
}

.overlay-editor__toolbar-container {
  display: flex;
  justify-content: center;
}

.overlay-editor__arrow-picker {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 12px;
  z-index: 100;
  min-width: 200px;
}

.overlay-editor__arrow-picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.overlay-editor__arrow-picker-title {
  font-size: 13px;
  font-weight: 600;
  color: #101828;
}

.overlay-editor__arrow-picker-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: none;
  border: none;
  border-radius: 4px;
  color: #99a1af;
  cursor: pointer;
  transition: all 0.15s ease;
}

.overlay-editor__arrow-picker-close:hover {
  background-color: #f3f4f6;
  color: #4a5565;
}

.overlay-editor__arrow-picker-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}

.overlay-editor__arrow-picker-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
}

.overlay-editor__arrow-picker-option:hover {
  background-color: #fef3c7;
  border-color: #fcd34d;
}

.overlay-editor__arrow-picker-icon {
  font-size: 18px;
  width: 24px;
  text-align: center;
}

.overlay-editor__arrow-picker-label {
  font-size: 12px;
  font-weight: 500;
  color: #101828;
}

.arrow-picker-enter-active,
.arrow-picker-leave-active {
  transition: all 0.2s ease;
}

.arrow-picker-enter-from,
.arrow-picker-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
