<script setup lang="ts">
import { computed } from 'vue';
import type { Overlay, ArrowDirection } from '@guidenav/types';
import arrow3dImage from '../assets/arrow-3d.png';
import arrowForwardImage from '../assets/arrow-forward.png';
import arrowCurvedRight from '../assets/arrow-curved-right.png';
import arrowCurvedLeft from '../assets/arrow-curved-left.png';

interface Props {
  imageUrl: string | null;
  overlays?: Overlay[];
  size?: 'sm' | 'md' | 'lg';
  fillContainer?: boolean;
  alt?: string;
}

const props = withDefaults(defineProps<Props>(), {
  overlays: () => [],
  size: 'md',
  fillContainer: false,
  alt: 'Step image',
});

const sizeClasses = {
  sm: 'step-thumbnail--sm',
  md: 'step-thumbnail--md',
  lg: 'step-thumbnail--lg',
};

const thumbnailClass = computed(() => {
  if (props.fillContainer) return 'step-thumbnail--fill';
  return sizeClasses[props.size];
});

const scaleFactors = {
  sm: 0.25,
  md: 0.35,
  lg: 0.5,
};

const scaleFactor = computed(() => scaleFactors[props.size]);

function getArrowConfig(direction?: ArrowDirection) {
  switch (direction) {
    case 'right':
      return { type: 'curved', image: arrowCurvedRight, rotation: 0 };
    case 'left':
      return { type: 'curved', image: arrowCurvedLeft, rotation: 0 };
    case 'upward':
      return { type: '3d', image: arrow3dImage, rotation: 0 };
    case 'downward':
      return { type: '3d', image: arrow3dImage, rotation: 180 };
    case 'forward':
      return { type: 'forward', image: arrowForwardImage, rotation: 0 };
    default:
      return { type: '3d', image: arrow3dImage, rotation: 0 };
  }
}

function getArrowStyle(overlay: Overlay) {
  const config = getArrowConfig(overlay.arrowDirection);
  const baseScale = overlay.scale * scaleFactor.value;
  return {
    left: `${overlay.x * 100}%`,
    top: `${overlay.y * 100}%`,
    transform: `translate(-50%, -50%) rotate(${config.rotation}deg) scale(${baseScale})`,
  };
}

function getMarkerStyle(overlay: Overlay) {
  return {
    left: `${overlay.x * 100}%`,
    top: `${overlay.y * 100}%`,
    transform: `translate(-50%, -50%) scale(${scaleFactor.value})`,
  };
}

function isCurvedArrow(direction?: ArrowDirection): boolean {
  return direction === 'right' || direction === 'left';
}

function is3DArrow(direction?: ArrowDirection): boolean {
  return direction === 'upward' || direction === 'downward' || direction === undefined;
}

function isForwardArrow(direction?: ArrowDirection): boolean {
  return direction === 'forward';
}

function getArrowImage(direction?: ArrowDirection): string {
  const config = getArrowConfig(direction);
  return config.image || arrow3dImage;
}

type LabelPosition = 'left' | 'right' | 'top' | 'bottom';

function getLabelPosition(overlay: Overlay): LabelPosition {
  const nearBottom = overlay.y > 0.7;
  const nearTop = overlay.y < 0.15;
  const nearRight = overlay.x > 0.75;
  const nearLeft = overlay.x < 0.25;
  
  if (nearBottom && nearRight) return 'left';
  if (nearBottom && nearLeft) return 'right';
  if (nearTop && nearRight) return 'left';
  if (nearTop && nearLeft) return 'right';
  if (nearBottom) return 'top';
  if (nearRight) return 'left';
  if (nearLeft) return 'right';
  
  return 'bottom';
}
</script>

<template>
  <div class="step-thumbnail" :class="thumbnailClass">
    <img 
      v-if="imageUrl"
      :src="imageUrl" 
      :alt="alt"
      class="step-thumbnail__image"
    />
    <div v-else class="step-thumbnail__placeholder" />
    
    <div v-if="imageUrl && overlays.length > 0" class="step-thumbnail__overlays">
      <template v-for="overlay in overlays" :key="overlay.id">
        <!-- Arrow overlay -->
        <div
          v-if="overlay.type === 'arrow'"
          class="step-thumbnail__arrow"
          :style="getArrowStyle(overlay)"
        >
          <!-- Curved arrows (right/left) -->
          <img 
            v-if="isCurvedArrow(overlay.arrowDirection)"
            :src="getArrowImage(overlay.arrowDirection)" 
            alt="" 
            class="step-thumbnail__arrow-img step-thumbnail__arrow-img--curved"
            draggable="false"
          />
          <!-- 3D arrows (top/bottom) -->
          <img 
            v-else-if="is3DArrow(overlay.arrowDirection)"
            :src="getArrowImage(overlay.arrowDirection)" 
            alt="" 
            class="step-thumbnail__arrow-img"
            draggable="false"
          />
          <!-- Forward arrow -->
          <img 
            v-else-if="isForwardArrow(overlay.arrowDirection)"
            :src="getArrowImage(overlay.arrowDirection)" 
            alt="" 
            class="step-thumbnail__arrow-img"
            draggable="false"
          />
        </div>
        
        <!-- Marker overlay -->
        <div
          v-else-if="overlay.type === 'marker'"
          class="step-thumbnail__marker"
          :class="[
            `step-thumbnail__marker--label-${getLabelPosition(overlay)}`,
            { 'step-thumbnail__marker--has-label': !!overlay.label }
          ]"
          :style="getMarkerStyle(overlay)"
        >
          <div class="step-thumbnail__marker-dot">
            <div class="step-thumbnail__marker-inner" />
          </div>
          <div v-if="overlay.label" class="step-thumbnail__marker-label-container">
            <div class="step-thumbnail__marker-connector" />
            <div class="step-thumbnail__marker-label">{{ overlay.label }}</div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.step-thumbnail {
  position: relative;
  border-radius: var(--radius-sm);
  overflow: hidden;
  border: 1px solid var(--color-border-light);
  flex-shrink: 0;
}

.step-thumbnail--sm {
  width: 48px;
  height: 48px;
}

.step-thumbnail--md {
  width: 64px;
  height: 64px;
}

.step-thumbnail--lg {
  width: 88px;
  height: 88px;
}

.step-thumbnail--fill {
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 0;
}

.step-thumbnail__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.step-thumbnail__placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--color-border-light) 0%, var(--color-border) 100%);
}

.step-thumbnail__overlays {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.step-thumbnail__arrow {
  position: absolute;
  transform-origin: center center;
}

.step-thumbnail__arrow-img {
  display: block;
  width: 60px;
  height: auto;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
  pointer-events: none;
}

.step-thumbnail__arrow-img--curved {
  width: 80px;
}

.step-thumbnail__arrow-svg {
  display: block;
  width: 60px;
  height: auto;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
  pointer-events: none;
}

.step-thumbnail__marker {
  position: absolute;
  display: flex;
  align-items: center;
}

.step-thumbnail__marker-dot {
  width: 32px;
  height: 32px;
  background-color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
  flex-shrink: 0;
}

.step-thumbnail__marker-inner {
  width: 14px;
  height: 14px;
  background-color: #ff6467;
  border-radius: 50%;
}

.step-thumbnail__marker-label-container {
  display: flex;
  align-items: center;
  position: absolute;
}

.step-thumbnail__marker-connector {
  width: 2px;
  height: 12px;
  background-color: #ff6467;
  flex-shrink: 0;
}

.step-thumbnail__marker-label {
  padding: 4px 8px;
  background-color: #ff6467;
  color: white;
  font-size: 10px;
  font-weight: 500;
  border-radius: 4px;
  white-space: nowrap;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}

/* Bottom position (default) */
.step-thumbnail__marker--label-bottom .step-thumbnail__marker-label-container {
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  flex-direction: column;
  margin-top: -2px;
}

.step-thumbnail__marker--label-bottom .step-thumbnail__marker-connector {
  width: 2px;
  height: 12px;
}

/* Top position */
.step-thumbnail__marker--label-top .step-thumbnail__marker-label-container {
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  flex-direction: column-reverse;
  margin-bottom: -2px;
}

.step-thumbnail__marker--label-top .step-thumbnail__marker-connector {
  width: 2px;
  height: 12px;
}

/* Left position */
.step-thumbnail__marker--label-left .step-thumbnail__marker-label-container {
  right: 100%;
  top: 50%;
  transform: translateY(-50%);
  flex-direction: row-reverse;
  margin-right: -2px;
}

.step-thumbnail__marker--label-left .step-thumbnail__marker-connector {
  width: 12px;
  height: 2px;
}

/* Right position */
.step-thumbnail__marker--label-right .step-thumbnail__marker-label-container {
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  flex-direction: row;
  margin-left: -2px;
}

.step-thumbnail__marker--label-right .step-thumbnail__marker-connector {
  width: 12px;
  height: 2px;
}
</style>
