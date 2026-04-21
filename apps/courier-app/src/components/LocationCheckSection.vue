<script setup lang="ts">
import { ref, shallowRef, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import type { Coordinates } from '@guidenav/types';
import { useCourierLocation } from '@/composables/useCourierLocation';
import { openMapsNative } from '@/utils/contact';

interface Props {
  destination: Coordinates | null;
  isRtl: boolean;
  onScrollNext: () => void;
  onScrollPrev: () => void;
}

const props = defineProps<Props>();

const mapContainer = ref<HTMLDivElement | null>(null);
const mapInstance = shallowRef<any>(null);
const destinationMarker = shallowRef<any>(null);
const courierMarker = shallowRef<any>(null);
const googleRef = shallowRef<any>(null);
const AdvancedMarkerClass = shallowRef<any>(null);
const PinElementClass = shallowRef<any>(null);
const resizeObserver = shallowRef<ResizeObserver | null>(null);

const isLoading = ref(true);
const loadError = ref<string | null>(null);
const isMapError = ref(false);

const {
  coordinates: courierCoords,
  status: courierStatus,
  requestLocation,
} = useCourierLocation({ enableHighAccuracy: true, timeoutMs: 10000 });

function waitForContainerSize(el: HTMLElement): Promise<void> {
  return new Promise((resolve) => {
    if (el.clientWidth > 0 && el.clientHeight > 0) {
      resolve();
      return;
    }
    const obs = new ResizeObserver(() => {
      if (el.clientWidth > 0 && el.clientHeight > 0) {
        obs.disconnect();
        resolve();
      }
    });
    obs.observe(el);
    setTimeout(() => {
      obs.disconnect();
      resolve();
    }, 3000);
  });
}

async function initMap() {
  await nextTick();
  if (!mapContainer.value) return;
  if (!props.destination) {
    loadError.value = props.isRtl
      ? 'لم يتم تحديد إحداثيات الوجهة'
      : 'Destination coordinates are not set';
    isMapError.value = true;
    isLoading.value = false;
    return;
  }

  await waitForContainerSize(mapContainer.value);

  try {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      loadError.value = props.isRtl
        ? 'لم يتم تكوين مفتاح خرائط Google'
        : 'Google Maps API key is not configured';
      isMapError.value = true;
      isLoading.value = false;
      return;
    }

    const { Loader } = await import('@googlemaps/js-api-loader');
    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['marker'],
    });

    googleRef.value = await loader.load();
    const google = googleRef.value;

    const { AdvancedMarkerElement, PinElement } = (await google.maps.importLibrary(
      'marker'
    )) as any;
    AdvancedMarkerClass.value = AdvancedMarkerElement;
    PinElementClass.value = PinElement;

    const destLatLng = {
      lat: props.destination.latitude,
      lng: props.destination.longitude,
    };

    mapInstance.value = new google.maps.Map(mapContainer.value, {
      center: destLatLng,
      zoom: 16,
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: 'greedy',
      clickableIcons: false,
      mapId: 'DEMO_MAP_ID',
    });

    const destPin = new PinElement({
      background: '#ef4444',
      borderColor: '#b91c1c',
      glyphColor: '#ffffff',
      scale: 1.3,
    });

    destinationMarker.value = new AdvancedMarkerElement({
      position: destLatLng,
      map: mapInstance.value,
      content: destPin,
      title: props.isRtl ? 'الوجهة' : 'Destination',
    });

    if (typeof ResizeObserver !== 'undefined' && mapContainer.value) {
      resizeObserver.value = new ResizeObserver(() => {
        if (mapInstance.value && googleRef.value) {
          googleRef.value.maps.event.trigger(mapInstance.value, 'resize');
          mapInstance.value.setCenter(destLatLng);
        }
      });
      resizeObserver.value.observe(mapContainer.value);
    }

    isLoading.value = false;

    void requestAndRenderCourier();
  } catch (err) {
    console.error('Failed to initialize map:', err);
    loadError.value = props.isRtl
      ? 'تعذر تحميل الخريطة'
      : 'Failed to load map';
    isMapError.value = true;
    isLoading.value = false;
  }
}

async function requestAndRenderCourier() {
  const coords = await requestLocation();
  if (!coords) return;
  renderCourierMarker(coords);
  fitBoundsToBoth(coords);
}

function renderCourierMarker(coords: Coordinates) {
  if (!mapInstance.value || !AdvancedMarkerClass.value || !PinElementClass.value) return;

  const pos = { lat: coords.latitude, lng: coords.longitude };

  if (courierMarker.value) {
    courierMarker.value.position = pos;
    courierMarker.value.map = mapInstance.value;
    return;
  }

  const pin = new PinElementClass.value({
    background: '#2563eb',
    borderColor: '#1d4ed8',
    glyphColor: '#ffffff',
    scale: 1.1,
  });

  courierMarker.value = new AdvancedMarkerClass.value({
    position: pos,
    map: mapInstance.value,
    content: pin,
    title: props.isRtl ? 'موقعك' : 'You',
  });
}

function fitBoundsToBoth(courier: Coordinates) {
  if (!mapInstance.value || !googleRef.value || !props.destination) return;
  const google = googleRef.value;
  const bounds = new google.maps.LatLngBounds();
  bounds.extend({ lat: props.destination.latitude, lng: props.destination.longitude });
  bounds.extend({ lat: courier.latitude, lng: courier.longitude });
  mapInstance.value.fitBounds(bounds, 80);
}

function handleOpenMaps() {
  if (!props.destination) return;
  openMapsNative(
    props.destination.latitude,
    props.destination.longitude,
    props.isRtl ? 'الوجهة' : 'Destination'
  );
}

function handleRecenter() {
  if (!mapInstance.value || !props.destination) return;
  if (courierCoords.value) {
    fitBoundsToBoth(courierCoords.value);
  } else {
    mapInstance.value.setCenter({
      lat: props.destination.latitude,
      lng: props.destination.longitude,
    });
    mapInstance.value.setZoom(16);
  }
}

function handleRetryLocation() {
  void requestAndRenderCourier();
}

watch(
  () => props.destination,
  (newVal, oldVal) => {
    if (!mapInstance.value || !newVal) return;
    if (oldVal && newVal.latitude === oldVal.latitude && newVal.longitude === oldVal.longitude) return;
    const pos = { lat: newVal.latitude, lng: newVal.longitude };
    mapInstance.value.setCenter(pos);
    if (destinationMarker.value) {
      destinationMarker.value.position = pos;
    }
  }
);

onMounted(() => {
  void initMap();
});

onBeforeUnmount(() => {
  if (resizeObserver.value) {
    resizeObserver.value.disconnect();
    resizeObserver.value = null;
  }
  if (courierMarker.value) courierMarker.value.map = null;
  if (destinationMarker.value) destinationMarker.value.map = null;
});
</script>

<template>
  <section class="map-section" :id="'landing-section-2'">
    <header class="section-header">
      <div class="section-header-inner">
        <h2 class="section-title">{{ isRtl ? 'تحقق من الموقع' : 'Location check' }}</h2>
        <p class="section-subtitle">
          {{ isRtl ? 'تأكد من أنك في الوجهة الصحيحة' : 'Make sure you are at the right destination' }}
        </p>
      </div>
    </header>

    <div class="map-wrapper">
      <div ref="mapContainer" class="map-canvas" aria-label="Destination map"></div>

      <div v-if="isLoading" class="map-overlay map-overlay--loading">
        <span class="map-spinner" aria-hidden="true"></span>
        <span>{{ isRtl ? 'جارٍ تحميل الخريطة...' : 'Loading map...' }}</span>
      </div>

      <div v-else-if="loadError && isMapError" class="map-overlay map-overlay--error">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
          <path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <span>{{ loadError }}</span>
      </div>

      <div v-if="!isLoading && !isMapError" class="map-legend">
        <div class="legend-item">
          <span class="legend-dot legend-dot--dest"></span>
          <span>{{ isRtl ? 'الوجهة' : 'Destination' }}</span>
        </div>
        <div class="legend-item" :class="{ 'legend-item--muted': courierStatus !== 'granted' }">
          <span class="legend-dot legend-dot--courier"></span>
          <span>{{ isRtl ? 'موقعك' : 'You' }}</span>
        </div>
      </div>

      <button
        v-if="!isLoading && !isMapError"
        class="map-fab map-fab--recenter"
        type="button"
        @click="handleRecenter"
        :aria-label="isRtl ? 'إعادة التمركز' : 'Recenter'"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    </div>

    <div v-if="courierStatus === 'denied' || courierStatus === 'unavailable' || courierStatus === 'timeout'" class="location-hint">
      <span>{{ isRtl ? 'تعذر الوصول إلى موقعك' : "Can't access your location" }}</span>
      <button type="button" class="location-hint-action" @click="handleRetryLocation">
        {{ isRtl ? 'حاول مجددًا' : 'Retry' }}
      </button>
    </div>

    <div class="map-actions">
      <button class="primary-button" type="button" @click="handleOpenMaps" :disabled="!destination">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 7l6-3 6 3 6-3v13l-6 3-6-3-6 3z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
          <path d="M9 4v13M15 7v13" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
        </svg>
        <span>{{ isRtl ? 'افتح في الخرائط' : 'Open in Maps' }}</span>
      </button>
    </div>

    <div class="scroll-controls">
      <button class="scroll-pill" type="button" @click="props.onScrollPrev" :aria-label="isRtl ? 'السابق' : 'Previous'">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 15l-6-6-6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <button class="scroll-pill scroll-pill--primary" type="button" @click="props.onScrollNext">
        <span>{{ isRtl ? 'الخطوات' : 'View steps' }}</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  </section>
</template>

<style scoped>
.map-section {
  min-height: 100%;
  scroll-snap-align: start;
  scroll-snap-stop: always;
  display: flex;
  flex-direction: column;
  background-color: #0f172a;
  color: white;
  padding-top: calc(env(safe-area-inset-top) + var(--spacing-md));
  padding-bottom: calc(env(safe-area-inset-bottom) + var(--spacing-md));
  padding-left: var(--spacing-md);
  padding-right: var(--spacing-md);
  gap: var(--spacing-sm);
}

.section-header-inner {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.section-kicker {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #93c5fd;
}

.section-title {
  font-size: 1.375rem;
  font-weight: 700;
  margin: 0;
  color: white;
}

.section-subtitle {
  font-size: var(--font-size-sm);
  color: #cbd5e1;
  margin: 0;
}

.map-wrapper {
  position: relative;
  flex: 1 1 auto;
  min-height: 360px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background-color: #1e293b;
  box-shadow: 0 12px 40px rgba(15, 23, 42, 0.45);
}

.map-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.map-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  background-color: rgba(15, 23, 42, 0.9);
  color: #e2e8f0;
  font-size: var(--font-size-sm);
  padding: var(--spacing-md);
  text-align: center;
}

.map-overlay--error {
  color: #fca5a5;
}

.map-spinner {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 3px solid rgba(148, 163, 184, 0.3);
  border-top-color: #60a5fa;
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .map-spinner {
    animation: none;
  }
}

.map-legend {
  position: absolute;
  top: 12px;
  left: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 12px;
  background-color: rgba(15, 23, 42, 0.85);
  border-radius: var(--radius-md);
  font-size: 12px;
  color: white;
  pointer-events: none;
}

[dir="rtl"] .map-legend {
  left: auto;
  right: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-item--muted {
  opacity: 0.55;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-dot--dest {
  background-color: #ef4444;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.3);
}

.legend-dot--courier {
  background-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.3);
}

.map-fab {
  position: absolute;
  bottom: 12px;
  right: 12px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background-color: white;
  color: var(--color-text);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.3);
}

[dir="rtl"] .map-fab {
  right: auto;
  left: 12px;
}

.location-hint {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
  padding: 10px 14px;
  background-color: rgba(251, 191, 36, 0.12);
  border: 1px solid rgba(251, 191, 36, 0.4);
  color: #fde68a;
  border-radius: var(--radius-md);
  font-size: 13px;
}

.location-hint-action {
  background: none;
  border: none;
  color: #fde68a;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
  padding: 4px 8px;
}

.map-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.primary-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  height: 52px;
  border-radius: var(--radius-lg);
  border: none;
  background-color: var(--color-primary);
  color: white;
  font-size: var(--font-size-base);
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.35);
}

.primary-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

.scroll-controls {
  display: flex;
  gap: var(--spacing-sm);
  justify-content: center;
}

.scroll-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 40px;
  padding: 0 16px;
  border-radius: var(--radius-full);
  border: 1px solid rgba(148, 163, 184, 0.4);
  background-color: rgba(255, 255, 255, 0.06);
  color: #e2e8f0;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.scroll-pill--primary {
  background-color: rgba(37, 99, 235, 0.2);
  border-color: rgba(96, 165, 250, 0.5);
  color: #bfdbfe;
}

[dir="rtl"] .scroll-pill svg,
[dir="rtl"] .primary-button svg {
  transform: scaleX(-1);
}
</style>
