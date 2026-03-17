<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  x: number;
  y: number;
  label: string;
  selected?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
});

const emit = defineEmits<{
  select: [];
}>();

type LabelPosition = 'left' | 'right' | 'top' | 'bottom';

const labelPosition = computed<LabelPosition>(() => {
  if (props.x > 0.6) return 'left';
  if (props.x < 0.4) return 'right';
  if (props.y < 0.3) return 'bottom';
  if (props.y > 0.7) return 'top';
  return 'left';
});

const markerStyle = computed(() => ({
  left: `${props.x * 100}%`,
  top: `${props.y * 100}%`,
}));

function handleClick(event: PointerEvent) {
  event.stopPropagation();
  emit('select');
}
</script>

<template>
  <div
    class="marker-overlay"
    :class="[
      `marker-overlay--label-${labelPosition}`,
      { 'marker-overlay--selected': selected }
    ]"
    :style="markerStyle"
    @pointerdown="handleClick"
  >
    <div class="marker-overlay__dot">
      <div class="marker-overlay__dot-inner" />
    </div>
    
    <div class="marker-overlay__label-container">
      <div class="marker-overlay__connector" />
      <div class="marker-overlay__label">
        {{ label }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.marker-overlay {
  position: absolute;
  transform: translate(-50%, -50%);
  cursor: pointer;
  touch-action: none;
  user-select: none;
  display: flex;
  align-items: center;
  z-index: 1;
}

.marker-overlay--selected {
  z-index: 2;
}

.marker-overlay__dot {
  width: 32px;
  height: 32px;
  background-color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  flex-shrink: 0;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.marker-overlay:hover .marker-overlay__dot {
  transform: scale(1.1);
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.3);
}

.marker-overlay--selected .marker-overlay__dot {
  box-shadow: 0 0 0 3px #155dfc, 0 2px 8px rgba(0, 0, 0, 0.25);
}

.marker-overlay__dot-inner {
  width: 14px;
  height: 14px;
  background-color: #ff6467;
  border-radius: 50%;
}

.marker-overlay__label-container {
  display: flex;
  align-items: center;
  position: absolute;
}

.marker-overlay__connector {
  width: 8px;
  height: 2px;
  background-color: #ff6467;
  flex-shrink: 0;
}

.marker-overlay__label {
  padding: 6px 12px;
  background-color: #ff6467;
  color: white;
  font-size: 13px;
  font-weight: 500;
  border-radius: 6px;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.marker-overlay--label-left .marker-overlay__label-container {
  right: 100%;
  flex-direction: row-reverse;
  margin-right: -4px;
}

.marker-overlay--label-right .marker-overlay__label-container {
  left: 100%;
  flex-direction: row;
  margin-left: -4px;
}

.marker-overlay--label-top .marker-overlay__label-container {
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  flex-direction: column-reverse;
  margin-bottom: -4px;
}

.marker-overlay--label-top .marker-overlay__connector {
  width: 2px;
  height: 8px;
}

.marker-overlay--label-bottom .marker-overlay__label-container {
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  flex-direction: column;
  margin-top: -4px;
}

.marker-overlay--label-bottom .marker-overlay__connector {
  width: 2px;
  height: 8px;
}
</style>
