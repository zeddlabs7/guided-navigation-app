<script setup lang="ts">
import { computed } from 'vue';
import type { ArrowDirection } from '@guidenav/types';
import arrowForwardImage from '../assets/arrow-forward.png';
import arrowCurvedRight from '../assets/arrow-curved-right.png';
import arrowCurvedLeft from '../assets/arrow-curved-left.png';

interface Props {
  x: number;
  y: number;
  scale: number;
  arrowDirection?: ArrowDirection;
  selected?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
  scale: 1,
  arrowDirection: 'top',
});

const emit = defineEmits<{
  select: [];
  'scale-drag-start': [event: PointerEvent];
}>();

const arrowConfig = computed(() => {
  switch (props.arrowDirection) {
    case 'right':
      return { type: 'curved', image: arrowCurvedRight, rotation: 0 };
    case 'left':
      return { type: 'curved', image: arrowCurvedLeft, rotation: 0 };
    case 'top':
      return { type: '3d', image: arrowForwardImage, rotation: 0 };
    case 'bottom':
      return { type: '3d', image: arrowForwardImage, rotation: 180 };
    case 'straight':
      return { type: '2d', image: null, rotation: 0 };
    case 'reverse':
      return { type: '2d', image: null, rotation: 180 };
    default:
      return { type: '3d', image: arrowForwardImage, rotation: 0 };
  }
});

const style = computed(() => ({
  left: `${props.x * 100}%`,
  top: `${props.y * 100}%`,
  transform: `translate(-50%, -50%) rotate(${arrowConfig.value.rotation}deg) scale(${props.scale})`,
}));

const isCurved = computed(() => arrowConfig.value.type === 'curved');
const is3D = computed(() => arrowConfig.value.type === '3d');
const is2D = computed(() => arrowConfig.value.type === '2d');

function handleClick(event: PointerEvent) {
  event.stopPropagation();
  emit('select');
}

function handleScaleHandleDown(event: PointerEvent) {
  event.stopPropagation();
  event.preventDefault();
  emit('scale-drag-start', event);
}
</script>

<template>
  <div
    class="arrow-overlay"
    :class="{ 'arrow-overlay--selected': selected }"
    :style="style"
    @pointerdown="handleClick"
  >
    <!-- Curved Arrow: Use curved PNG images for right/left -->
    <img 
      v-if="isCurved"
      :src="arrowConfig.image" 
      alt="Arrow" 
      class="arrow-overlay__image arrow-overlay__image--curved"
      draggable="false"
    />
    
    <!-- 3D Arrow: Use PNG image for top/bottom -->
    <img 
      v-else-if="is3D"
      :src="arrowConfig.image" 
      alt="Arrow" 
      class="arrow-overlay__image"
      draggable="false"
    />
    
    <!-- 2D Arrow: Custom SVG for straight/reverse -->
    <svg
      v-else-if="is2D"
      class="arrow-overlay__svg"
      width="60"
      height="80"
      viewBox="0 0 450 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M225 0 L60 180 L150 180 L150 480 L300 480 L300 180 L390 180 Z"
        fill="#ffde53"
      />
    </svg>
    
    <!-- Scale handle (at bottom) -->
    <div
      v-if="selected"
      class="arrow-overlay__scale-handle"
      @pointerdown="handleScaleHandleDown"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 21L15 15M21 21V15M21 21H15" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M3 3L9 9M3 3V9M3 3H9" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
  </div>
</template>

<style scoped>
.arrow-overlay {
  position: absolute;
  cursor: pointer;
  touch-action: none;
  user-select: none;
  transform-origin: center center;
}

.arrow-overlay--selected {
  z-index: 10;
}

.arrow-overlay__image {
  display: block;
  width: 60px;
  height: auto;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  pointer-events: none;
}

.arrow-overlay__image--curved {
  width: 80px;
}

.arrow-overlay__svg {
  display: block;
  width: 60px;
  height: auto;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
  pointer-events: none;
}

.arrow-overlay--selected .arrow-overlay__image {
  filter: drop-shadow(0 0 6px rgba(200, 180, 0, 0.7)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.arrow-overlay--selected .arrow-overlay__svg {
  filter: drop-shadow(0 0 4px rgba(200, 180, 0, 0.5)) drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
}

.arrow-overlay__scale-handle {
  position: absolute;
  bottom: -28px;
  left: 50%;
  transform: translateX(-50%);
  width: 28px;
  height: 28px;
  background-color: white;
  border: 2px solid #C8A000;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ns-resize;
  color: #C8A000;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  touch-action: none;
}

.arrow-overlay__scale-handle:active {
  background-color: #fffef0;
}
</style>
