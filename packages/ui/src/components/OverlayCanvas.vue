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
  'add-overlay': [x: number, y: number, rotation?: number, scale?: number];
  'update-overlay': [id: string, updates: Partial<Overlay>];
  'canvas-tap': [x: number, y: number];
}>();

const canvasRef = ref<HTMLDivElement | null>(null);
const imageRef = ref<HTMLImageElement | null>(null);

const isDrawingArrow = ref(false);
const arrowStartPos = ref({ x: 0, y: 0 });
const arrowStartScreen = ref({ x: 0, y: 0 });

function getImageRect(): DOMRect | null {
  return imageRef.value?.getBoundingClientRect() ?? null;
}

function screenToNormalized(screenX: number, screenY: number): { x: number; y: number } | null {
  const rect = getImageRect();
  if (!rect) return null;
  
  return {
    x: Math.max(0, Math.min(1, (screenX - rect.left) / rect.width)),
    y: Math.max(0, Math.min(1, (screenY - rect.top) / rect.height)),
  };
}

function calculateAngle(centerX: number, centerY: number, pointX: number, pointY: number): number {
  const deltaX = pointX - centerX;
  const deltaY = pointY - centerY;
  return Math.atan2(deltaY, deltaX) * (180 / Math.PI);
}

function handleCanvasPointerDown(event: PointerEvent) {
  const target = event.target as HTMLElement;
  
  if (!canvasRef.value?.contains(target)) return;
  if (target.closest('.arrow-overlay') || target.closest('.marker-overlay')) {
    return;
  }
  
  const pos = screenToNormalized(event.clientX, event.clientY);
  if (!pos) return;
  
  if (props.mode === 'add-arrow') {
    isDrawingArrow.value = true;
    arrowStartPos.value = pos;
    arrowStartScreen.value = { x: event.clientX, y: event.clientY };
    canvasRef.value?.setPointerCapture(event.pointerId);
  } else if (props.mode === 'add-marker') {
    emit('canvas-tap', pos.x, pos.y);
  } else {
    emit('select-overlay', null);
  }
}

function handleCanvasPointerMove(_event: PointerEvent) {
  // Arrow drawing preview could be added here
}

function handleCanvasPointerUp(event: PointerEvent) {
  if (isDrawingArrow.value && props.mode === 'add-arrow') {
    const endPos = screenToNormalized(event.clientX, event.clientY);
    if (endPos) {
      const dx = endPos.x - arrowStartPos.value.x;
      const dy = endPos.y - arrowStartPos.value.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Calculate scale based on drag distance (0.02 = small, 0.2 = large)
      // Map to scale range 0.6 to 1.8
      const scale = Math.max(0.6, Math.min(1.8, 0.6 + (distance / 0.2) * 1.2));
      
      // Arrow points UP by default, so add 90 to make drag direction match arrow direction
      let rotation = -90; // default: pointing up
      if (distance > 0.02) {
        rotation = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
      }
      
      emit('add-overlay', arrowStartPos.value.x, arrowStartPos.value.y, rotation, distance > 0.02 ? scale : 1);
    }
    isDrawingArrow.value = false;
    canvasRef.value?.releasePointerCapture(event.pointerId);
  }
}

function handleOverlaySelect(id: string) {
  emit('select-overlay', id);
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
  let lastAngle = calculateAngle(centerX, centerY, event.clientX, event.clientY);
  
  const target = event.target as HTMLElement;
  target.setPointerCapture(event.pointerId);
  
  const handleMove = (e: PointerEvent) => {
    const currentOverlay = props.overlays.find(o => o.id === overlayId);
    if (!currentOverlay) return;
    
    const currentAngle = calculateAngle(centerX, centerY, e.clientX, e.clientY);
    const angleDelta = currentAngle - lastAngle;
    lastAngle = currentAngle;
    
    emit('update-overlay', overlayId, { rotation: currentOverlay.rotation + angleDelta });
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
    // Drag down = bigger, drag up = smaller
    const deltaY = e.clientY - startY;
    const scaleDelta = deltaY / 100; // 100px = 1.0 scale change
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
  
  const target = event.currentTarget as HTMLElement;
  target.setPointerCapture(event.pointerId);
  
  const handleMove = (e: PointerEvent) => {
    const pos = screenToNormalized(e.clientX - offsetX, e.clientY - offsetY);
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
    @pointermove="handleCanvasPointerMove"
    @pointerup="handleCanvasPointerUp"
    @pointercancel="handleCanvasPointerUp"
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
          :rotation="overlay.rotation"
          :scale="overlay.scale"
          :arrow-style="overlay.arrowStyle || '3d'"
          :selected="selectedId === overlay.id"
          @select="handleOverlaySelect(overlay.id)"
          @rotation-drag-start="(e) => handleRotationDragStart(e, overlay.id)"
          @scale-drag-start="(e) => handleScaleDragStart(e, overlay.id)"
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
      {{ mode === 'add-arrow' ? 'Tap and drag to draw arrow' : 'Tap to place marker' }}
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
