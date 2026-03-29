<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Overlay } from '@guidenav/types';
import ArrowOverlay from './ArrowOverlay.vue';
import MarkerOverlay from './MarkerOverlay.vue';

type EditorMode = 'view' | 'add-arrow' | 'add-marker' | 'select';

interface Props {
  imageUrl: string;
  overlays: Overlay[];
  selectedId: string | null;
  mode: EditorMode;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'select-overlay': [id: string | null];
  'add-overlay': [x: number, y: number];
  'update-overlay': [id: string, updates: Partial<Overlay>];
  'canvas-tap': [x: number, y: number];
}>();

const canvasRef = ref<HTMLDivElement | null>(null);
const imageRef = ref<HTMLImageElement | null>(null);

function getImageRect(): DOMRect | null {
  return imageRef.value?.getBoundingClientRect() ?? null;
}

function screenToNormalized(screenX: number, screenY: number, padding: number = 0): { x: number; y: number } | null {
  const rect = getImageRect();
  if (!rect) return null;
  
  const rawX = (screenX - rect.left) / rect.width;
  const rawY = (screenY - rect.top) / rect.height;
  
  return {
    x: Math.max(padding, Math.min(1 - padding, rawX)),
    y: Math.max(padding, Math.min(1 - padding, rawY)),
  };
}

function getMarkerPadding(): { paddingX: number; paddingY: number } {
  const rect = getImageRect();
  if (!rect) return { paddingX: 0.05, paddingY: 0.05 };
  
  const markerRadius = 16;
  return {
    paddingX: markerRadius / rect.width,
    paddingY: markerRadius / rect.height,
  };
}

function screenToNormalizedForMarker(screenX: number, screenY: number): { x: number; y: number } | null {
  const rect = getImageRect();
  if (!rect) return null;
  
  const { paddingX, paddingY } = getMarkerPadding();
  
  const rawX = (screenX - rect.left) / rect.width;
  const rawY = (screenY - rect.top) / rect.height;
  
  return {
    x: Math.max(paddingX, Math.min(1 - paddingX, rawX)),
    y: Math.max(paddingY, Math.min(1 - paddingY, rawY)),
  };
}

function handleCanvasPointerDown(event: PointerEvent) {
  const target = event.target as HTMLElement;
  
  if (!canvasRef.value?.contains(target)) return;
  if (target.closest('.arrow-overlay') || target.closest('.marker-overlay')) {
    return;
  }
  
  if (props.mode === 'add-arrow') {
    const pos = screenToNormalized(event.clientX, event.clientY, 0.05);
    if (!pos) return;
    emit('add-overlay', pos.x, pos.y);
  } else if (props.mode === 'add-marker') {
    const pos = screenToNormalizedForMarker(event.clientX, event.clientY);
    if (!pos) return;
    emit('canvas-tap', pos.x, pos.y);
  } else {
    emit('select-overlay', null);
  }
}

function handleOverlaySelect(id: string) {
  emit('select-overlay', id);
}

function handleScaleDragStart(event: PointerEvent, overlayId: string) {
  event.stopPropagation();
  event.preventDefault();
  
  const overlay = props.overlays.find(o => o.id === overlayId);
  if (!overlay) return;
  
  const startY = event.clientY;
  const startScale = overlay.scale;
  
  const target = event.target as HTMLElement;
  target.setPointerCapture(event.pointerId);
  
  const handleMove = (e: PointerEvent) => {
    const deltaY = e.clientY - startY;
    const scaleDelta = deltaY / 100;
    const newScale = Math.max(0.4, Math.min(2.5, startScale + scaleDelta));
    
    emit('update-overlay', overlayId, { scale: newScale });
  };
  
  const handleUp = (e: PointerEvent) => {
    target.releasePointerCapture(e.pointerId);
    target.removeEventListener('pointermove', handleMove);
    target.removeEventListener('pointerup', handleUp);
    target.removeEventListener('pointercancel', handleUp);
  };
  
  target.addEventListener('pointermove', handleMove);
  target.addEventListener('pointerup', handleUp);
  target.addEventListener('pointercancel', handleUp);
}

function handleRotationDragStart(event: PointerEvent, overlayId: string) {
  event.stopPropagation();
  event.preventDefault();
  
  const overlay = props.overlays.find(o => o.id === overlayId);
  if (!overlay) return;
  
  const rect = getImageRect();
  if (!rect) return;
  
  const centerX = rect.left + overlay.x * rect.width;
  const centerY = rect.top + overlay.y * rect.height;
  
  const startAngle = Math.atan2(event.clientY - centerY, event.clientX - centerX);
  const startRotation = overlay.rotation ?? 0;
  
  const target = event.target as HTMLElement;
  target.setPointerCapture(event.pointerId);
  
  const handleMove = (e: PointerEvent) => {
    const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    const angleDelta = (currentAngle - startAngle) * (180 / Math.PI);
    const newRotation = startRotation + angleDelta;
    
    emit('update-overlay', overlayId, { rotation: newRotation });
  };
  
  const handleUp = (e: PointerEvent) => {
    target.releasePointerCapture(e.pointerId);
    target.removeEventListener('pointermove', handleMove);
    target.removeEventListener('pointerup', handleUp);
    target.removeEventListener('pointercancel', handleUp);
  };
  
  target.addEventListener('pointermove', handleMove);
  target.addEventListener('pointerup', handleUp);
  target.addEventListener('pointercancel', handleUp);
}

function handleOverlayDragStart(event: PointerEvent, overlayId: string) {
  if (props.selectedId !== overlayId) return;
  
  const overlay = props.overlays.find(o => o.id === overlayId);
  if (!overlay) return;
  
  event.stopPropagation();
  
  const rect = getImageRect();
  if (!rect) return;
  
  const overlayScreenX = rect.left + overlay.x * rect.width;
  const overlayScreenY = rect.top + overlay.y * rect.height;
  const offsetX = event.clientX - overlayScreenX;
  const offsetY = event.clientY - overlayScreenY;
  
  const isMarker = overlay.type === 'marker';
  
  const target = event.currentTarget as HTMLElement;
  target.setPointerCapture(event.pointerId);
  
  const handleMove = (e: PointerEvent) => {
    let pos;
    if (isMarker) {
      pos = screenToNormalizedForMarker(e.clientX - offsetX, e.clientY - offsetY);
    } else {
      pos = screenToNormalized(e.clientX - offsetX, e.clientY - offsetY, 0.02);
    }
    if (pos) {
      emit('update-overlay', overlayId, { x: pos.x, y: pos.y });
    }
  };
  
  const handleUp = (e: PointerEvent) => {
    target.releasePointerCapture(e.pointerId);
    target.removeEventListener('pointermove', handleMove);
    target.removeEventListener('pointerup', handleUp);
    target.removeEventListener('pointercancel', handleUp);
  };
  
  target.addEventListener('pointermove', handleMove);
  target.addEventListener('pointerup', handleUp);
  target.addEventListener('pointercancel', handleUp);
}

const cursorStyle = computed(() => {
  if (props.mode === 'add-arrow') return 'crosshair';
  if (props.mode === 'add-marker') return 'crosshair';
  return 'default';
});
</script>

<template>
  <div
    ref="canvasRef"
    class="overlay-canvas"
    :style="{ cursor: cursorStyle }"
    @pointerdown="handleCanvasPointerDown"
  >
    <img
      ref="imageRef"
      :src="imageUrl"
      alt="Step image"
      class="overlay-canvas__image"
      draggable="false"
    />
    
    <div class="overlay-canvas__overlays">
      <template v-for="overlay in overlays" :key="overlay.id">
        <ArrowOverlay
          v-if="overlay.type === 'arrow'"
          :x="overlay.x"
          :y="overlay.y"
          :scale="overlay.scale"
          :rotation="overlay.rotation ?? 0"
          :arrow-direction="overlay.arrowDirection || 'up-down'"
          :selected="selectedId === overlay.id"
          @select="handleOverlaySelect(overlay.id)"
          @scale-drag-start="(e) => handleScaleDragStart(e, overlay.id)"
          @rotation-drag-start="(e) => handleRotationDragStart(e, overlay.id)"
          @pointerdown="(e: PointerEvent) => handleOverlayDragStart(e, overlay.id)"
        />
        <MarkerOverlay
          v-else-if="overlay.type === 'marker'"
          :x="overlay.x"
          :y="overlay.y"
          :label="overlay.label || ''"
          :selected="selectedId === overlay.id"
          @select="handleOverlaySelect(overlay.id)"
          @pointerdown="(e: PointerEvent) => handleOverlayDragStart(e, overlay.id)"
        />
      </template>
    </div>
    
    <div
      v-if="mode === 'add-arrow' || mode === 'add-marker'"
      class="overlay-canvas__hint"
    >
      {{ mode === 'add-arrow' ? 'Tap to place arrow' : 'Tap to place marker' }}
    </div>
  </div>
</template>

<style scoped>
.overlay-canvas {
  position: relative;
  width: 100%;
  border-radius: 14px;
  overflow: hidden;
  touch-action: none;
  user-select: none;
  background-color: #f3f4f6;
}

.overlay-canvas__image {
  display: block;
  width: 100%;
  height: auto;
  pointer-events: none;
}

.overlay-canvas__overlays {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.overlay-canvas__overlays > * {
  pointer-events: auto;
}

.overlay-canvas__hint {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 16px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: 13px;
  font-weight: 500;
  border-radius: 20px;
  pointer-events: none;
}
</style>
