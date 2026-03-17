<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { Overlay, ArrowStyle } from '@guidenav/types';
import OverlayCanvas from './OverlayCanvas.vue';
import OverlayToolbar from './OverlayToolbar.vue';
import LabelInputModal from './LabelInputModal.vue';

type EditorMode = 'view' | 'add-arrow' | 'add-marker' | 'select';

interface Props {
  imageUrl: string;
  overlays: Overlay[];
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
});

const emit = defineEmits<{
  'update:overlays': [overlays: Overlay[]];
}>();

const mode = ref<EditorMode>('view');
const selectedOverlayId = ref<string | null>(null);
const showLabelModal = ref(false);
const pendingMarkerPosition = ref<{ x: number; y: number } | null>(null);
const editingLabelOverlayId = ref<string | null>(null);

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

function generateId(): string {
  return `overlay-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function handleAddArrowClick() {
  if (props.readonly) return;
  mode.value = mode.value === 'add-arrow' ? 'view' : 'add-arrow';
  selectedOverlayId.value = null;
}

function handleAddMarkerClick() {
  if (props.readonly) return;
  mode.value = mode.value === 'add-marker' ? 'view' : 'add-marker';
  selectedOverlayId.value = null;
}

function handleSelectOverlay(id: string | null) {
  selectedOverlayId.value = id;
  if (id) {
    mode.value = 'select';
  } else if (mode.value === 'select') {
    mode.value = 'view';
  }
}

function handleAddOverlay(x: number, y: number, rotation?: number, scale?: number) {
  if (mode.value === 'add-arrow') {
    const newOverlay: Overlay = {
      id: generateId(),
      type: 'arrow',
      x,
      y,
      rotation: rotation ?? -90,
      scale: scale ?? 1,
      label: null,
      arrowStyle: '3d',
    };
    emit('update:overlays', [...props.overlays, newOverlay]);
    selectedOverlayId.value = newOverlay.id;
    mode.value = 'select';
  }
}

function handleCanvasTap(x: number, y: number) {
  if (mode.value === 'add-marker') {
    // Place marker directly without label
    const newOverlay: Overlay = {
      id: generateId(),
      type: 'marker',
      x,
      y,
      rotation: 0,
      scale: 1,
      label: null,
    };
    emit('update:overlays', [...props.overlays, newOverlay]);
    selectedOverlayId.value = newOverlay.id;
    mode.value = 'select';
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
      rotation: 0,
      scale: 1,
      label,
    };
    emit('update:overlays', [...props.overlays, newOverlay]);
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

function handleRotateLeft() {
  if (!selectedOverlayId.value) return;
  const overlay = props.overlays.find(o => o.id === selectedOverlayId.value);
  if (overlay && overlay.type === 'arrow') {
    handleUpdateOverlay(selectedOverlayId.value, { rotation: overlay.rotation - 15 });
  }
}

function handleRotateRight() {
  if (!selectedOverlayId.value) return;
  const overlay = props.overlays.find(o => o.id === selectedOverlayId.value);
  if (overlay && overlay.type === 'arrow') {
    handleUpdateOverlay(selectedOverlayId.value, { rotation: overlay.rotation + 15 });
  }
}

function handleToggleStyle() {
  if (!selectedOverlayId.value) return;
  const overlay = props.overlays.find(o => o.id === selectedOverlayId.value);
  if (overlay && overlay.type === 'arrow') {
    const newStyle: ArrowStyle = overlay.arrowStyle === '3d' ? '2d' : '3d';
    handleUpdateOverlay(selectedOverlayId.value, { arrowStyle: newStyle });
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
        
        <button
          class="overlay-editor__add-btn"
          :class="{ 'overlay-editor__add-btn--active': mode === 'add-arrow' }"
          @click="handleAddArrowClick"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Add Arrow
        </button>
        
        <button
          class="overlay-editor__add-btn"
          :class="{ 'overlay-editor__add-btn--active': mode === 'add-marker' }"
          @click="handleAddMarkerClick"
        >
          <span class="overlay-editor__marker-dot" />
          Add Marker
        </button>
      </div>
      
      <div v-if="selectedOverlay" class="overlay-editor__toolbar-container">
        <OverlayToolbar
          :overlay-type="selectedOverlay.type"
          :arrow-style="selectedOverlay.arrowStyle"
          :has-label="!!selectedOverlay.label"
          :visible="true"
          @rotate-left="handleRotateLeft"
          @rotate-right="handleRotateRight"
          @toggle-style="handleToggleStyle"
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
</style>
