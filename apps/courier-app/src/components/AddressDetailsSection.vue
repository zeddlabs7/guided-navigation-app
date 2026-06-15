<script setup lang="ts">
import { computed, ref, shallowRef, onMounted, nextTick, watch, onBeforeUnmount } from 'vue';
import {
  getMetadataFieldConfigs,
  type Coordinates,
  type GuidanceSet,
  type MetadataFieldConfig,
  type MetadataFieldType,
} from '@guidenav/types';
import { openMapsNative } from '@/utils/contact';
import { useTranslation } from '@/composables/useTranslation';
import { useCourierSession } from '@/composables/useCourierSession';

const { t } = useTranslation();
const { currentLanguage } = useCourierSession();

interface Props {
  guidanceSet: GuidanceSet;
  isRtl: boolean;
  destination: Coordinates | null;
  destinationAddress: string | null;
  locationCheckImageUrl: string | null;
  hasSteps: boolean;
  onViewSteps: () => void;
}

const props = defineProps<Props>();

interface MetadataRow {
  field: MetadataFieldType;
  label: string;
  value: string;
}

function getFieldValue(field: MetadataFieldType): string {
  const raw = (props.guidanceSet as unknown as Record<string, string | undefined>)[field];
  if (!raw) return '';
  if (field === 'unitType') {
    if (raw === 'villa') return t('villa');
    if (raw === 'apartment') return t('apartment');
  }
  return raw;
}

function shouldShowField(config: MetadataFieldConfig): boolean {
  if (!getFieldValue(config.field)) return false;
  if (config.dependsOn) {
    const rawValue = (props.guidanceSet as unknown as Record<string, string | undefined>)[config.dependsOn.field];
    if (rawValue !== config.dependsOn.value) return false;
  }
  return true;
}

const metadataRows = computed<MetadataRow[]>(() => {
  const configs = getMetadataFieldConfigs(props.guidanceSet.addressType);
  return configs
    .filter(shouldShowField)
    .map(config => ({
      field: config.field,
      label: config.label[currentLanguage.value],
      value: getFieldValue(config.field),
    }));
});

const isWideMetadataField = (field: MetadataFieldType) =>
  field === 'compoundName' || field === 'locationDescription';

const destinationLabel = computed(() => {
  if (props.destinationAddress) return props.destinationAddress;
  const g = props.guidanceSet;
  const parts: string[] = [];
  if (g.buildingNumber) parts.push(g.buildingNumber);
  if (g.compoundName) parts.push(g.compoundName);
  if (g.floorNumber) parts.push(`${t('floor')} ${g.floorNumber}`);
  if (g.doorNumber) parts.push(`${t('door')} ${g.doorNumber}`);
  if (g.locationDescription) parts.push(g.locationDescription);
  if (parts.length > 0) return parts.join(', ');
  return g.title || t('destination');
});

const miniMapContainer = ref<HTMLDivElement | null>(null);
const miniMapInstance = shallowRef<any>(null);
const miniMapReady = ref(false);

async function initMiniMap() {
  await nextTick();
  if (!miniMapContainer.value || !props.destination) return;

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return;

  try {
    const { Loader } = await import('@googlemaps/js-api-loader');
    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['marker'],
    });

    const google = await loader.load();
    const destLatLng = {
      lat: props.destination.latitude,
      lng: props.destination.longitude,
    };

    miniMapInstance.value = new google.maps.Map(miniMapContainer.value, {
      center: destLatLng,
      zoom: 15,
      disableDefaultUI: true,
      gestureHandling: 'none',
      clickableIcons: false,
      mapId: 'MINI_MAP_ID',
      keyboardShortcuts: false,
    });

    const { AdvancedMarkerElement, PinElement } = (await google.maps.importLibrary('marker')) as any;
    const pin = new PinElement({
      background: '#ef4444',
      borderColor: '#b91c1c',
      glyphColor: '#ffffff',
      scale: 0.8,
    });

    new AdvancedMarkerElement({
      position: destLatLng,
      map: miniMapInstance.value,
      content: pin,
    });

    miniMapReady.value = true;
  } catch {
    // Silently fail — the placeholder icon will show
  }
}

watch(() => props.destination, (val) => {
  if (val && !miniMapInstance.value) {
    void initMiniMap();
  }
});

onMounted(() => {
  if (props.destination) {
    void initMiniMap();
  }
});

function handleOpenMaps() {
  if (!props.destination) return;
  openMapsNative(
    props.destination.latitude,
    props.destination.longitude,
    t('destination')
  );
}

const isImageExpanded = ref(false);

function openImageViewer() {
  isImageExpanded.value = true;
  document.body.style.overflow = 'hidden';
}

function closeImageViewer() {
  isImageExpanded.value = false;
  document.body.style.overflow = '';
}

onBeforeUnmount(() => {
  document.body.style.overflow = '';
});
</script>

<template>
  <section class="address-section" :id="'landing-section-1'">
    <div class="address-content">
      <ul v-if="metadataRows.length > 0" class="metadata-list">
        <li
          v-for="row in metadataRows"
          :key="row.field"
          class="metadata-row"
          :class="{ 'metadata-row--wide': isWideMetadataField(row.field) }"
        >
          <span class="metadata-label">{{ row.label }}</span>
          <span class="metadata-value">{{ row.value }}</span>
        </li>
      </ul>

      <p v-else class="no-metadata">
        {{ t('noAddressDetails') }}
      </p>
    </div>

    <div class="bottom-actions">
      <div
        v-if="locationCheckImageUrl || destination"
        class="bottom-actions-cards"
        :class="{ 'bottom-actions-cards--single': !(locationCheckImageUrl && destination) }"
      >
        <button
          v-if="locationCheckImageUrl"
          class="location-image-card"
          type="button"
          @click="openImageViewer"
        >
          <img :src="locationCheckImageUrl" alt="" class="location-image-thumb" />
          <span class="location-image-label">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            {{ t('locationPhoto') }}
          </span>
        </button>

        <button
          v-if="destination"
          class="directions-card"
          type="button"
          @click="handleOpenMaps"
        >
          <div class="directions-body">
            <span class="directions-label">
              {{ t('getDirections') }}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
            <span class="directions-address">{{ destinationLabel }}</span>
          </div>
          <div class="directions-map">
            <div ref="miniMapContainer" class="directions-map-canvas"></div>
            <div v-if="!miniMapReady" class="directions-map-placeholder">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" fill="currentColor"/>
              </svg>
            </div>
          </div>
        </button>
      </div>

      <button
        v-if="hasSteps"
        class="steps-hint"
        type="button"
        @click="props.onViewSteps"
        :aria-label="t('arrivalSteps')"
      >
        <span class="steps-hint-icon" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" stroke-width="2"/>
            <path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
        <span class="steps-hint-text">{{ t('arrivalSteps') }}</span>
        <span class="steps-hint-arrow" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
      </button>
    </div>

    <Teleport to="body">
      <div
        v-if="isImageExpanded && locationCheckImageUrl"
        class="image-viewer-overlay"
        @click="closeImageViewer"
      >
        <button class="image-viewer-close" type="button" @click.stop="closeImageViewer" :aria-label="t('close')">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <img :src="locationCheckImageUrl" alt="" class="image-viewer-img" @click.stop />
      </div>
    </Teleport>
  </section>
</template>

<style scoped>
.address-section {
  --gap: clamp(3px, 0.7dvh, 6px);
  --meta-label: clamp(8px, 1.8dvh, 10px);
  --meta-value: clamp(11px, 2.4dvh, 13px);
  --card-pad: clamp(4px, 1dvh, 8px);
  --thumb-h: clamp(32px, 6.5dvh, 48px);
  --map-size: clamp(32px, 6.5dvh, 40px);

  height: 100%;
  scroll-snap-align: start;
  scroll-snap-stop: always;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 60%, #eff6ff 100%);
  padding: var(--gap) var(--spacing-md) calc(env(safe-area-inset-bottom) + var(--gap));
  gap: var(--gap);
  position: relative;
}

.address-content {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-width: 480px;
  width: 100%;
  margin: 0 auto;
}

.metadata-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--gap);
  align-content: start;
}

.metadata-row {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: var(--card-pad);
  background-color: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  min-width: 0;
}

.metadata-row--wide {
  grid-column: 1 / -1;
}

.metadata-label {
  font-size: var(--meta-label);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  font-weight: 500;
  line-height: 1.15;
}

.metadata-value {
  font-size: var(--meta-value);
  color: var(--color-text);
  font-weight: 600;
  line-height: 1.2;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  word-break: break-word;
}

.no-metadata {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin: 0;
  font-style: italic;
}

.bottom-actions {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: var(--gap);
  align-items: center;
  max-width: 480px;
  width: 100%;
  margin: 0 auto;
}

.bottom-actions-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--gap);
  width: 100%;
}

.bottom-actions-cards--single {
  grid-template-columns: 1fr;
}

.directions-card {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  min-width: 0;
  padding: var(--card-pad);
  background-color: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  text-align: start;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
}

.directions-card:active {
  border-color: var(--color-primary);
}

.directions-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.directions-label {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: var(--meta-label);
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-primary);
}

.directions-address {
  font-size: var(--meta-value);
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.2;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.directions-map {
  position: relative;
  width: var(--map-size);
  height: var(--map-size);
  flex-shrink: 0;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background-color: var(--color-primary-light);
}

.directions-map-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.directions-map-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
  background-color: var(--color-primary-light);
}

.steps-hint {
  display: inline-flex;
  align-items: center;
  gap: clamp(4px, 1dvh, 8px);
  padding: clamp(6px, 1.4dvh, 10px) clamp(14px, 3dvh, 20px);
  background-color: white;
  border: 2px solid var(--color-primary);
  border-radius: var(--radius-full);
  color: var(--color-text);
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.08);
  animation: bounce 1.8s ease-in-out infinite;
}

.steps-hint:active {
  animation: none;
}

.steps-hint-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
  flex-shrink: 0;
}

.steps-hint-icon svg {
  width: clamp(16px, 3.5dvh, 20px);
  height: clamp(16px, 3.5dvh, 20px);
}

.steps-hint-text {
  font-size: clamp(12px, 2.6dvh, 14px);
  font-weight: 600;
  white-space: nowrap;
}

.steps-hint-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.steps-hint-arrow svg {
  width: clamp(14px, 3dvh, 18px);
  height: clamp(14px, 3dvh, 18px);
}

.location-image-card {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 2px;
  width: 100%;
  min-width: 0;
  padding: var(--card-pad);
  background-color: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  text-align: start;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
}

.location-image-card:active {
  border-color: var(--color-primary);
}

.location-image-thumb {
  width: 100%;
  height: var(--thumb-h);
  object-fit: cover;
  border-radius: calc(var(--radius-sm) - 1px);
  flex-shrink: 0;
}

.location-image-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  font-size: var(--meta-label);
  font-weight: 600;
  color: var(--color-primary);
}

.image-viewer-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background-color: rgba(0, 0, 0, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-lg);
}

.image-viewer-close {
  position: absolute;
  top: calc(env(safe-area-inset-top) + 16px);
  right: 16px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background-color: rgba(255, 255, 255, 0.15);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1;
}

[dir="rtl"] .image-viewer-close {
  right: auto;
  left: 16px;
}

.image-viewer-img {
  max-width: 100%;
  max-height: 85vh;
  object-fit: contain;
  border-radius: var(--radius-md);
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(2px); }
}

@media (prefers-reduced-motion: reduce) {
  .steps-hint {
    animation: none;
  }
}

@media (min-width: 400px) {
  .metadata-list {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .metadata-row--wide {
    grid-column: span 2;
  }
}
</style>
