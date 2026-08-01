<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import {
  getMetadataFieldConfigs,
  type Coordinates,
  type GuidanceSet,
  type GuidanceStep,
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
  steps: GuidanceStep[];
  onViewAllSteps: () => void;
}

const props = defineProps<Props>();

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

const DESTINATION_FIELDS: MetadataFieldType[] = ['compoundName', 'gateNumber', 'locationDescription', 'villaNumber'];
const ADDRESS_DETAIL_FIELDS: MetadataFieldType[] = ['buildingNumber', 'floorNumber', 'doorNumber', 'apartmentNumber', 'unitType'];

const allVisibleFields = computed(() => {
  const configs = getMetadataFieldConfigs(props.guidanceSet.addressType);
  return configs.filter(shouldShowField);
});

const destinationSummary = computed(() => {
  const parts: string[] = [];
  for (const field of DESTINATION_FIELDS) {
    const config = allVisibleFields.value.find(c => c.field === field);
    if (config) {
      parts.push(getFieldValue(field));
    }
  }
  if (parts.length === 0) {
    const building = getFieldValue('buildingNumber');
    if (building) return building;
    return props.guidanceSet.title || '';
  }
  return parts.join(', ');
});

const addressDetailLines = computed(() => {
  const lines: { label: string; value: string }[] = [];
  const lang = currentLanguage.value;
  for (const field of ADDRESS_DETAIL_FIELDS) {
    const config = allVisibleFields.value.find(c => c.field === field);
    if (config) {
      const value = getFieldValue(field);
      if (field === 'unitType') continue;
      const label = config.label[lang] || config.label.en;
      lines.push({ label, value });
    }
  }
  return lines;
});

const stepThumbnails = computed(() => {
  const urls: string[] = [];
  for (const step of props.steps) {
    const url = step.image?.publicUrl;
    if (url) urls.push(url);
    if (urls.length >= 4) break;
  }
  return urls;
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
const locationImagePreloaded = ref(false);
const locationImageRendered = ref(false);

function openImageViewer() {
  locationImageRendered.value = locationImagePreloaded.value;
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

onMounted(() => {
  if (props.locationCheckImageUrl) {
    const lcImg = new Image();
    lcImg.onload = () => { locationImagePreloaded.value = true; };
    lcImg.src = props.locationCheckImageUrl;
  }
});
</script>

<template>
  <section class="address-section">
    <div class="address-content">
      <!-- Address cards -->
      <div class="address-cards">
        <div v-if="destinationSummary" class="address-card">
          <span class="address-card-label">{{ t('destinationLabel') }}</span>
          <span class="address-card-value">{{ destinationSummary }}</span>
        </div>

        <div v-if="addressDetailLines.length > 0" class="address-card">
          <span class="address-card-label">{{ t('addressDetailsLabel') }}</span>
          <div class="address-lines">
            <div v-for="(line, i) in addressDetailLines" :key="i" class="address-line">
              <span class="address-line-label">{{ line.label }}</span>
              <span class="address-line-value">{{ line.value }}</span>
            </div>
          </div>
        </div>

        <p v-if="!destinationSummary && addressDetailLines.length === 0" class="no-metadata">
          {{ t('noAddressDetails') }}
        </p>
      </div>

      <!-- Action buttons with thumbnails -->
      <div class="action-buttons">
        <button
          v-if="destination"
          class="action-btn action-btn--maps"
          type="button"
          @click="handleOpenMaps"
        >
          <div class="action-btn-thumb">
            <svg class="action-btn-thumb-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" fill="currentColor"/>
            </svg>
          </div>
          <span class="action-btn-label">{{ t('openGoogleMaps') }}</span>
          <svg class="action-btn-external" width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>

        <button
          v-if="locationCheckImageUrl"
          class="action-btn action-btn--photo"
          type="button"
          @click="openImageViewer"
        >
          <div class="action-btn-thumb">
            <img
              :src="locationCheckImageUrl"
              alt=""
              class="action-btn-thumb-img"
              loading="lazy"
            />
          </div>
          <span class="action-btn-label">{{ t('viewLocationPhoto') }}</span>
          <svg class="action-btn-external" width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>

      <!-- Arrival guide button with step thumbnails -->
      <button
        v-if="steps.length > 0"
        class="guide-toggle"
        type="button"
        @click="props.onViewAllSteps"
      >
        <div class="guide-toggle-top">
          <span class="guide-toggle-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" stroke-width="2"/>
              <path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
          <span class="guide-toggle-text">{{ t('startArrivalGuide') }}</span>
          <span class="guide-toggle-count">{{ steps.length }} {{ t('step').toLowerCase() + (steps.length !== 1 ? 's' : '') }}</span>
          <svg class="guide-toggle-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div v-if="stepThumbnails.length > 0" class="guide-thumbs">
          <div
            v-for="(url, i) in stepThumbnails"
            :key="i"
            class="guide-thumb"
          >
            <img :src="url" alt="" class="guide-thumb-img" loading="lazy" />
          </div>
          <div v-if="steps.length > stepThumbnails.length" class="guide-thumb guide-thumb--more">
            +{{ steps.length - stepThumbnails.length }}
          </div>
        </div>
      </button>
    </div>

    <!-- Full-screen image viewer -->
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
        <div v-show="!locationImageRendered" class="image-viewer-loading">
          <span class="spinner" />
        </div>
        <div v-show="locationImageRendered" class="image-viewer-zoom-wrapper" @click.stop>
          <img
            :src="locationCheckImageUrl"
            alt=""
            class="image-viewer-img"
            @load="locationImageRendered = true"
          />
        </div>
      </div>
    </Teleport>
  </section>
</template>

<style scoped>
.address-section {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  padding: clamp(12px, 2dvh, 20px) var(--spacing-md) calc(env(safe-area-inset-bottom) + clamp(8px, 1.5dvh, 16px));
}

.address-content {
  display: flex;
  flex-direction: column;
  gap: clamp(12px, 2.5dvh, 20px);
  max-width: 480px;
  width: 100%;
  margin: 0 auto;
}

/* Address cards */
.address-cards {
  display: flex;
  flex-direction: column;
  gap: clamp(8px, 1.5dvh, 12px);
}

.address-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: clamp(12px, 2dvh, 16px);
  background-color: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
}

.address-card-label {
  font-size: clamp(10px, 1.8dvh, 12px);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  line-height: 1.2;
  margin-bottom: 2px;
}

.address-card-value {
  font-size: clamp(15px, 2.8dvh, 17px);
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.35;
  word-break: break-word;
}

.address-lines {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.address-line {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  padding: 6px 0;
  border-bottom: 1px solid #f1f5f9;
}

.address-line:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.address-line-label {
  font-size: clamp(12px, 2dvh, 14px);
  font-weight: 500;
  color: var(--color-text-muted);
  white-space: nowrap;
  flex-shrink: 0;
}

.address-line-value {
  font-size: clamp(15px, 2.8dvh, 17px);
  font-weight: 600;
  color: var(--color-text);
  text-align: end;
  word-break: break-word;
}

.no-metadata {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin: 0;
  font-style: italic;
}

/* Action buttons with thumbnails */
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: clamp(8px, 1.5dvh, 12px);
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: clamp(10px, 2dvh, 14px) clamp(12px, 2dvh, 16px);
  border-radius: var(--radius-lg);
  border: none;
  cursor: pointer;
  text-align: start;
  font-family: inherit;
  transition: transform 0.1s ease, box-shadow 0.1s ease;
}

.action-btn:active {
  transform: scale(0.98);
}

.action-btn--maps {
  background-color: var(--color-primary);
  color: white;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25);
}

.action-btn--photo {
  background-color: white;
  color: var(--color-text);
  border: 2px solid var(--color-border);
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.06);
}

.action-btn--photo:active {
  border-color: var(--color-primary);
}

.action-btn-thumb {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.15);
}

.action-btn--photo .action-btn-thumb {
  background-color: #f1f5f9;
}

.action-btn-thumb-icon {
  flex-shrink: 0;
}

.action-btn-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.action-btn-label {
  flex: 1;
  font-size: clamp(15px, 3dvh, 17px);
  font-weight: 600;
  line-height: 1.3;
}

.action-btn-external {
  flex-shrink: 0;
  opacity: 0.6;
}

/* Arrival guide button */
.guide-toggle {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  padding: clamp(12px, 2dvh, 16px);
  border: 2px solid var(--color-primary);
  border-radius: var(--radius-lg);
  background-color: white;
  cursor: pointer;
  text-align: start;
  font-family: inherit;
  box-shadow: 0 2px 12px rgba(22, 163, 74, 0.10);
  transition: transform 0.1s ease;
}

.guide-toggle:active {
  transform: scale(0.98);
}

.guide-toggle-top {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.guide-toggle-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background-color: var(--color-primary-light);
  color: var(--color-primary);
  flex-shrink: 0;
}

.guide-toggle-text {
  flex: 1;
  font-size: clamp(15px, 2.8dvh, 17px);
  font-weight: 600;
  color: var(--color-text);
}

.guide-toggle-count {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.guide-toggle-arrow {
  color: var(--color-primary);
  flex-shrink: 0;
}

[dir="rtl"] .guide-toggle-arrow {
  transform: scaleX(-1);
}

/* Step thumbnail strip */
.guide-thumbs {
  display: flex;
  gap: 6px;
  overflow: hidden;
}

.guide-thumb {
  width: 56px;
  height: 42px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
  background-color: #f1f5f9;
}

.guide-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.guide-thumb--more {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-muted);
  background-color: #e2e8f0;
}

/* Full-screen image viewer */
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

.image-viewer-loading {
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(255, 255, 255, 0.2);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.image-viewer-zoom-wrapper {
  overflow: auto;
  max-width: 100%;
  max-height: 85vh;
  touch-action: pinch-zoom pan-x pan-y;
  -webkit-overflow-scrolling: touch;
}

.image-viewer-img {
  max-width: 100%;
  max-height: 85vh;
  object-fit: contain;
  border-radius: var(--radius-md);
}
</style>
