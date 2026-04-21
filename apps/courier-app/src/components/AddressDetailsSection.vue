<script setup lang="ts">
import { computed } from 'vue';
import {
  ADDRESS_TYPE_LABELS,
  getMetadataFieldConfigs,
  type GuidanceSet,
  type MetadataFieldConfig,
  type MetadataFieldType,
} from '@guidenav/types';

interface Props {
  guidanceSet: GuidanceSet;
  isRtl: boolean;
  languageToggleLabel: string;
  onToggleLanguage: () => void;
  onScrollNext: () => void;
}

const props = defineProps<Props>();

const addressTypeLabel = computed(() => {
  const labels = ADDRESS_TYPE_LABELS[props.guidanceSet.addressType];
  return props.isRtl ? labels.ar : labels.en;
});

const addressTitle = computed(() => props.guidanceSet.title || 'Arriveo');

interface MetadataRow {
  field: MetadataFieldType;
  label: string;
  value: string;
}

function getFieldValue(field: MetadataFieldType): string {
  const raw = (props.guidanceSet as unknown as Record<string, string | undefined>)[field];
  if (!raw) return '';
  if (field === 'unitType') {
    if (raw === 'villa') return props.isRtl ? 'فيلا' : 'Villa';
    if (raw === 'apartment') return props.isRtl ? 'شقة' : 'Apartment';
  }
  return raw;
}

function shouldShowField(config: MetadataFieldConfig): boolean {
  if (!getFieldValue(config.field)) return false;
  if (config.dependsOn) {
    const depValue = getFieldValue(config.dependsOn.field);
    const expected = config.dependsOn.value;
    const normalized = depValue === (props.isRtl ? 'فيلا' : 'Villa') ? 'villa'
      : depValue === (props.isRtl ? 'شقة' : 'Apartment') ? 'apartment'
      : depValue;
    if (normalized !== expected) return false;
  }
  return true;
}

const metadataRows = computed<MetadataRow[]>(() => {
  const configs = getMetadataFieldConfigs(props.guidanceSet.addressType);
  return configs
    .filter(shouldShowField)
    .map(config => ({
      field: config.field,
      label: props.isRtl ? config.label.ar : config.label.en,
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
</script>

<template>
  <section class="address-section" :id="'landing-section-1'">
    <header class="address-header">
      <div class="brand">
        <span class="brand-dot" aria-hidden="true"></span>
        <span class="brand-name">Arriveo</span>
      </div>
      <button class="language-toggle" type="button" @click="props.onToggleLanguage">
        {{ languageToggleLabel }}
      </button>
    </header>

    <div class="address-content">
      <div class="address-type-badge">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="currentColor"/>
        </svg>
        <span>{{ addressTypeLabel }}</span>
      </div>

      <h1 class="address-title">{{ addressTitle }}</h1>

      <p v-if="guidanceSet.description" class="address-description">
        {{ guidanceSet.description }}
      </p>

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
        {{ isRtl ? 'لا توجد تفاصيل إضافية للعنوان' : 'No additional address details provided' }}
      </p>
    </div>

    <button class="scroll-hint" type="button" @click="props.onScrollNext" :aria-label="isRtl ? 'التالي' : 'Continue'">
      <span class="scroll-hint-text">{{ isRtl ? 'اسحب للأسفل للخريطة' : 'Scroll for map' }}</span>
      <span class="scroll-hint-arrow" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
    </button>
  </section>
</template>

<style scoped>
.address-section {
  min-height: 100%;
  scroll-snap-align: start;
  scroll-snap-stop: always;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 60%, #eff6ff 100%);
  padding: calc(env(safe-area-inset-top) + var(--spacing-md)) var(--spacing-lg) var(--spacing-lg);
  position: relative;
}

.address-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-weight: 700;
  font-size: var(--font-size-lg);
  color: var(--color-text);
}

.brand-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.language-toggle {
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background-color: white;
  font-size: var(--font-size-sm);
  color: var(--color-text);
  cursor: pointer;
  flex-shrink: 0;
}

.address-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding: var(--spacing-lg) 0;
  max-width: 480px;
  width: 100%;
  margin: 0 auto;
}

.address-type-badge {
  display: inline-flex;
  align-self: flex-start;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background-color: var(--color-primary-light);
  color: var(--color-primary);
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.address-title {
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1.2;
  color: var(--color-text);
  margin: 0;
}

.address-description {
  font-size: var(--font-size-base);
  color: var(--color-text-muted);
  line-height: 1.5;
  margin: 0;
}

.metadata-list {
  list-style: none;
  margin: var(--spacing-sm) 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.metadata-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background-color: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.metadata-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-primary-light);
  color: var(--color-primary);
  flex-shrink: 0;
}

.metadata-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.metadata-label {
  font-size: 12px;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 500;
}

.metadata-value {
  font-size: var(--font-size-base);
  color: var(--color-text);
  font-weight: 600;
  word-break: break-word;
}

.no-metadata {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin: var(--spacing-sm) 0 0;
  font-style: italic;
}

.scroll-hint {
  position: relative;
  margin-top: auto;
  margin-bottom: calc(env(safe-area-inset-bottom) + var(--spacing-md));
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: var(--spacing-sm);
}

.scroll-hint-text {
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.02em;
}

.scroll-hint-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: white;
  color: var(--color-primary);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
  animation: bounce 1.8s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(4px); }
}

@media (prefers-reduced-motion: reduce) {
  .scroll-hint-arrow {
    animation: none;
  }
}
</style>
