<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { logAnalyticsEvent } from '@/utils/lazyFirebase';
import { useCourierSession } from '@/composables/useCourierSession';
import { useTranslation } from '@/composables/useTranslation';
import { openWhatsApp } from '@/utils/contact';

const route = useRoute();
const router = useRouter();
const token = route.params.token as string;

const { t } = useTranslation();

const {
  guidanceSet,
  dropOffStep,
  totalSteps,
  isRtl,
  currentLanguage,
  getRecipientPhoneNumber,
  getGuidanceTitle,
  getContactPreferenceLongText,
  getCourierContactPreference,
} = useCourierSession();

const contactPreferenceInstruction = computed(() => {
  const texts = getContactPreferenceLongText();
  return texts[currentLanguage.value];
});

const isCallOnArrival = computed(() => getCourierContactPreference() === 'CALL_ON_ARRIVAL');
const deliveryConfirmed = ref(false);
const isConfirming = ref(false);

onMounted(() => {
  if (!guidanceSet.value) {
    router.replace(`/g/${token}`);
  }
});

const dropOffImage = computed(() => dropOffStep.value?.image?.publicUrl);

const guidanceTitle = computed(() => getGuidanceTitle());

function handleConfirmDelivery() {
  if (isConfirming.value || deliveryConfirmed.value) return;

  isConfirming.value = true;

  // Open WhatsApp synchronously FIRST so the browser keeps the user-gesture
  // context — any `await` before window.open() causes mobile browsers
  // (and popup blockers) to silently block the new tab/app launch.
  const phoneNumber = getRecipientPhoneNumber();
  if (phoneNumber) {
    const message = isRtl.value
      ? 'مرحبًا، لقد وصلت إلى نقطة التسليم وتم تأكيد التوصيل. يرجى الاطلاع على الصورة المرفقة.'
      : 'Hello, I have arrived at the drop-off point and confirmed the delivery. Please see photo attached.';
    openWhatsApp(phoneNumber, message);
  } else {
    console.warn('No recipient phone number available — skipping WhatsApp.');
  }

  // Fire-and-forget analytics so it never delays or blocks the WhatsApp launch.
  if (guidanceSet.value) {
    logAnalyticsEvent({
      app: 'COURIER',
      eventType: 'DELIVERY_CONFIRMED',
      guidanceSetId: guidanceSet.value.id,
      metadata: {
        token,
        timestamp: new Date().toISOString(),
      },
    }).catch((error) => {
      console.error('Failed to log analytics:', error);
    });
  }

  deliveryConfirmed.value = true;
  isConfirming.value = false;
}

function handleContactRecipient() {
  const phoneNumber = getRecipientPhoneNumber();
  if (phoneNumber) {
    openWhatsApp(phoneNumber);
  }
}

function handleBack() {
  const stepCount = totalSteps.value;
  if (stepCount > 0) {
    router.push(`/g/${token}/step/${stepCount - 1}`);
  } else {
    router.push(`/g/${token}/landing`);
  }
}

function handleHome() {
  router.push(`/g/${token}/landing`);
}
</script>

<template>
  <div class="complete-page" :dir="isRtl ? 'rtl' : 'ltr'">
    <!-- Header -->
    <header class="complete-header">
      <button class="header-back" @click="handleBack" :aria-label="t('back')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <span class="header-title"></span>
      <div class="header-actions">
        <button class="header-home" @click="handleHome" :aria-label="t('home')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1h-5v-7h-6v7H4a1 1 0 01-1-1V9.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        
      </div>
    </header>

    <!-- Drop-off Image -->
    <div class="dropoff-image-container">
      <img
        v-if="dropOffImage"
        :src="dropOffImage"
        alt="Drop-off point"
        class="dropoff-image"
      />
      <div v-else class="dropoff-image-placeholder">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
        </svg>
      </div>
      
      <!-- Destination Label -->
      <div class="destination-badge">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
        </svg>
        <span class="destination-badge-text">{{ guidanceTitle }}</span>
      </div>

      <!-- Location Badge -->
      <div class="location-badge">
        <div class="badge-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M22 4L12 14.01l-3-3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="badge-text">
          <span class="badge-title">{{ t('dropOffPoint') }}</span>
          <span class="badge-subtitle">{{ t('finalStepReached') }}</span>
        </div>
      </div>
    </div>

    <!-- Success Content -->
    <div class="success-content">
      <!-- Success Icon -->
      <div class="success-icon" :class="{ 'success-icon--confirmed': deliveryConfirmed }">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M22 4L12 14.01l-3-3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>

      <!-- Success Text -->
      <h1 class="success-title">
        {{ deliveryConfirmed ? t('deliveryConfirmed') : t('reachedDropOff') }}
      </h1>
      
      <p class="success-message">
        {{ deliveryConfirmed ? t('thankYou') : t('confirmBelow') }}
      </p>
    </div>

    <!-- Contact Preference Instruction -->
    <div class="contact-instruction" :class="isCallOnArrival ? 'contact-instruction--call' : 'contact-instruction--no-call'">
      <div class="contact-instruction-icon">
        <svg v-if="isCallOnArrival" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M13.73 21a2 2 0 01-3.46 0M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M3 3l18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
      <span class="contact-instruction-text">{{ contactPreferenceInstruction }}</span>
    </div>

    <!-- Action Buttons -->
    <div class="action-buttons">
      <button
        v-if="!deliveryConfirmed"
        class="action-button action-button--confirm"
        :disabled="isConfirming"
        @click="handleConfirmDelivery"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M22 4L12 14.01l-3-3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>{{ isConfirming ? t('confirming') : t('confirmDelivery') }}</span>
      </button>

      <p v-if="!deliveryConfirmed" class="whatsapp-hint">
        <svg class="whatsapp-hint-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>{{ t('whatsappHint') }}</span>
      </p>

      <button class="action-button action-button--contact" @click="handleContactRecipient">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>{{ t('contactRecipient') }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.complete-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-background);
}

/* Header */
.complete-header {
  display: flex;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: white;
  border-bottom: 1px solid var(--color-border);
  gap: var(--spacing-sm);
}

.header-back {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  border: none;
  background-color: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: background-color 0.15s ease;
}

.header-back:hover {
  opacity: 0.9;
}

.header-title {
  flex: 1;
  font-size: var(--font-size-base);
  font-weight: 500;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  flex-shrink: 0;
}

.header-home {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background-color: white;
  color: var(--color-text);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: background-color 0.15s ease;
}

.header-home:hover {
  background-color: var(--color-background);
}

[dir="rtl"] .header-back svg {
  transform: scaleX(-1);
}

/* Destination Badge */
.destination-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  background-color: rgba(0, 0, 0, 0.6);
  border-radius: var(--radius-full);
  color: white;
  max-width: 60%;
  z-index: 2;
}

[dir="rtl"] .destination-badge {
  left: auto;
  right: 12px;
}

.destination-badge-text {
  font-size: 12px;
  font-weight: 500;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Drop-off Image */
.dropoff-image-container {
  position: relative;
  aspect-ratio: 393 / 220;
  background-color: #1f2937;
}

.dropoff-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.dropoff-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
}

.location-badge {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
}

.badge-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background-color: var(--color-success);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.badge-text {
  display: flex;
  flex-direction: column;
}

.badge-title {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: white;
}

.badge-subtitle {
  font-size: var(--font-size-sm);
  color: rgba(255, 255, 255, 0.8);
}

/* Success Content */
.success-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--spacing-xl) var(--spacing-lg);
}

.success-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: #dcfce7;
  color: var(--color-success);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--spacing-lg);
  transition: all 0.3s ease;
}

.success-icon--confirmed {
  background-color: var(--color-success);
  color: white;
}

.success-title {
  font-size: 1.375rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 var(--spacing-xs) 0;
  line-height: 1.3;
}

.success-message {
  font-size: var(--font-size-base);
  color: var(--color-text-muted);
  margin: 0;
  max-width: 300px;
}

/* Action Buttons */
.action-buttons {
  padding: var(--spacing-md) var(--spacing-md) var(--spacing-xl);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.action-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  border: none;
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  height: 48px;
}

.action-button--confirm {
  background-color: var(--color-success);
  color: white;
}

.action-button--confirm:hover:not(:disabled) {
  background-color: #15803d;
}

.action-button--confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-button--contact {
  background-color: white;
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.action-button--contact:hover {
  background-color: var(--color-background);
}

.whatsapp-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  margin: 0;
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  text-align: center;
  line-height: 1.4;
}

.whatsapp-hint-icon {
  flex-shrink: 0;
  color: #25D366;
}

/* Contact Preference Instruction */
.contact-instruction {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  margin: 0 var(--spacing-md);
  border-radius: var(--radius-lg);
  font-weight: 500;
}

.contact-instruction--call {
  background-color: #eff6ff;
  color: #1d4ed8;
}

.contact-instruction--no-call {
  background-color: #fef3c7;
  color: #92400e;
}

.contact-instruction-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.contact-instruction-text {
  font-size: var(--font-size-sm);
  line-height: 1.4;
}
</style>
