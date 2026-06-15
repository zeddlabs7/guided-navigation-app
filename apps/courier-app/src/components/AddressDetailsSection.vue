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

const FIELD_ICONS: Record<MetadataFieldType, string> = {
  buildingNumber: 'building',
  floorNumber: 'floor',
  doorNumber: 'door',
  compoundName: 'compound',
  gateNumber: 'gate',
  unitType: 'unit',
  villaNumber: 'villa',
  apartmentNumber: 'door',
  locationDescription: 'location',
};

function iconFor(field: MetadataFieldType): string {
  return FIELD_ICONS[field] ?? 'location';
}

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
        <li v-for="row in metadataRows" :key="row.field" class="metadata-row">
          <span class="metadata-icon" :data-icon="iconFor(row.field)">
            <svg v-if="iconFor(row.field) === 'building'" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h2M13 9h2M9 13h2M13 13h2M9 17h2M13 17h2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <svg v-else-if="iconFor(row.field) === 'floor'" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 20h16M4 15h16M4 10h16M4 5h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
            <svg v-else-if="iconFor(row.field) === 'door'" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 3h12v18H6zM10 12h.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <svg v-else-if="iconFor(row.field) === 'compound'" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 21V10l5-4 5 4v11M13 21V13l4-3 4 3v8M3 21h18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <svg v-else-if="iconFor(row.field) === 'gate'" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 21V5a2 2 0 012-2h12a2 2 0 012 2v16M4 11h16M9 21v-6M15 21v-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <svg v-else-if="iconFor(row.field) === 'unit'" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 9l9-6 9 6v12H3zM9 21v-6h6v6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <svg v-else-if="iconFor(row.field) === 'villa'" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 10l9-7 9 7v11H3zM9 21v-7h6v7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" fill="currentColor"/>
            </svg>
          </span>
          <div class="metadata-body">
            <span class="metadata-label">{{ row.label }}</span>
            <span class="metadata-value">{{ row.value }}</span>
          </div>
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
          <span class="location-image-label">
            {{ t('locationPhoto') }}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
          <div class="location-image-frame">
            <img :src="locationCheckImageUrl" alt="" class="location-image-thumb" />
          </div>
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
  --row-gap: clamp(5px, 1.1dvh, 10px);
  --meta-label: clamp(10px, 1.9dvh, 12px);
  --meta-value: clamp(13px, 2.6dvh, 15px);
  --icon-size: clamp(32px, 5.8dvh, 38px);
  --card-pad: clamp(8px, 1.6dvh, 12px);
  --map-strip-h: clamp(36px, 6.5dvh, 44px);

  height: 100%;
  scroll-snap-align: start;
  scroll-snap-stop: always;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: linear-gradient(180deg, var(--color-background) 0%, #ffffff 60%, #eff6ff 100%);
  padding: var(--row-gap) var(--spacing-md) calc(env(safe-area-inset-bottom) + var(--row-gap));
  gap: var(--row-gap);
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
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: var(--row-gap);
}

.metadata-row {
  flex: 1 1 0;
  min-height: clamp(36px, 6.2dvh, 46px);
  max-height: clamp(44px, 7.8dvh, 56px);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 0 var(--card-pad);
  background-color: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  min-width: 0;
}

.metadata-icon {
  width: var(--icon-size);
  height: var(--icon-size);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-primary-light);
  color: var(--color-primary);
  flex-shrink: 0;
}

.metadata-icon svg {
  width: clamp(14px, 3dvh, 18px);
  height: clamp(14px, 3dvh, 18px);
}

.metadata-body {
  display: flex;
  flex-direction: column;
  gap: clamp(1px, 0.4dvh, 4px);
  min-width: 0;
  flex: 1;
  justify-content: center;
}

.metadata-label {
  font-size: var(--meta-label);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 500;
  line-height: 1.2;
}

.metadata-value {
  font-size: var(--meta-value);
  color: var(--color-text);
  font-weight: 600;
  line-height: 1.25;
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
  gap: clamp(10px, 2dvh, 16px);
  align-items: center;
  max-width: 480px;
  width: 100%;
  margin: 0 auto;
}

.bottom-actions-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--row-gap);
  width: 100%;
  align-items: stretch;
}

.bottom-actions-cards--single {
  grid-template-columns: 1fr;
}

.directions-card {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: clamp(4px, 0.8dvh, 6px);
  width: 100%;
  min-width: 0;
  height: 100%;
  padding: var(--card-pad);
  background-color: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  text-align: start;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
}

.directions-card:active {
  border-color: var(--color-primary);
}

.directions-body {
  flex: 0 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: clamp(2px, 0.5dvh, 4px);
}

.directions-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--meta-label);
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-primary);
}

.directions-address {
  font-size: clamp(11px, 2.2dvh, 13px);
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

.directions-map {
  position: relative;
  width: 100%;
  height: var(--map-strip-h);
  flex-shrink: 0;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background-color: var(--color-primary-light);
}

.bottom-actions-cards--single .directions-card {
  flex-direction: row;
  align-items: center;
}

.bottom-actions-cards--single .directions-map {
  width: clamp(48px, 9dvh, 64px);
  height: clamp(48px, 9dvh, 64px);
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
  gap: clamp(6px, 1.2dvh, 10px);
  padding: clamp(10px, 1.8dvh, 13px) clamp(18px, 3.5dvh, 24px);
  margin-top: clamp(2px, 0.5dvh, 4px);
  background-color: white;
  border: 2px solid var(--color-primary);
  border-radius: var(--radius-full);
  color: var(--color-text);
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.10);
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
  width: clamp(18px, 3.8dvh, 22px);
  height: clamp(18px, 3.8dvh, 22px);
}

.steps-hint-text {
  font-size: clamp(13px, 2.8dvh, 15px);
  font-weight: 600;
  white-space: nowrap;
}

.steps-hint-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-light);
  flex-shrink: 0;
}

.steps-hint-arrow svg {
  width: clamp(16px, 3.4dvh, 20px);
  height: clamp(16px, 3.4dvh, 20px);
}

.location-image-card {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: clamp(4px, 0.8dvh, 6px);
  width: 100%;
  min-width: 0;
  height: 100%;
  min-height: 0;
  padding: var(--card-pad);
  background-color: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  text-align: start;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
}

.location-image-card:active {
  border-color: var(--color-primary);
}

.location-image-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  font-size: var(--meta-label);
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-primary);
  line-height: 1.2;
}

.location-image-frame {
  flex: 1 1 0;
  min-height: var(--map-strip-h);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.location-image-thumb {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.bottom-actions-cards--single .location-image-card {
  flex-direction: row;
  align-items: center;
  height: auto;
}

.bottom-actions-cards--single .location-image-frame {
  flex: 0 0 auto;
  width: clamp(48px, 9dvh, 64px);
  height: clamp(48px, 9dvh, 64px);
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
  50% { transform: translateY(3px); }
}

@media (prefers-reduced-motion: reduce) {
  .steps-hint {
    animation: none;
  }
}
</style>
