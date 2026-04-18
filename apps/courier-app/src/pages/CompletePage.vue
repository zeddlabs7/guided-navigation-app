<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { logAnalyticsEvent } from '@guidenav/services';
import { useCourierSession } from '@/composables/useCourierSession';
import { openWhatsApp } from '@/utils/contact';

const route = useRoute();
const token = route.params.token as string;

const {
  guidanceSet,
  dropOffStep,
  currentLanguage,
  getRecipientPhoneNumber,
} = useCourierSession();

const isRtl = computed(() => currentLanguage.value === 'ar');
const deliveryConfirmed = ref(false);
const isConfirming = ref(false);

const dropOffImage = computed(() => dropOffStep.value?.image?.publicUrl);

const guidanceTitle = computed(() => guidanceSet.value?.title || 'Arriveo');

async function handleConfirmDelivery() {
  if (isConfirming.value || deliveryConfirmed.value) return;

  isConfirming.value = true;

  try {
    if (guidanceSet.value) {
      await logAnalyticsEvent({
        app: 'COURIER',
        eventType: 'DELIVERY_CONFIRMED',
        guidanceSetId: guidanceSet.value.id,
        metadata: {
          token,
          timestamp: new Date().toISOString(),
        },
      });
    }

    const phoneNumber = getRecipientPhoneNumber();
    if (phoneNumber) {
      const message = isRtl.value
        ? 'مرحبًا، لقد وصلت إلى نقطة التسليم وتم تأكيد التوصيل. يرجى الاطلاع على الصورة المرفقة.'
        : 'Hello, I have arrived at the drop-off point and confirmed the delivery. Please see photo attached.';
      openWhatsApp(phoneNumber, message);
    }

    deliveryConfirmed.value = true;
  } catch (error) {
    console.error('Failed to confirm delivery:', error);
  } finally {
    isConfirming.value = false;
  }
}

function handleContactRecipient() {
  const phoneNumber = getRecipientPhoneNumber();
  if (phoneNumber) {
    openWhatsApp(phoneNumber);
  }
}
</script>

<template>
  <div class="complete-page" :dir="isRtl ? 'rtl' : 'ltr'">
    <!-- Header -->
    <header class="complete-header">
      <div class="header-icon">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 11l18-9-9 18-2-8-7-1z" fill="currentColor"/>
        </svg>
      </div>
      <span class="header-title">{{ guidanceTitle }}</span>
      <div class="header-spacer"></div>
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
      
      <!-- Location Badge -->
      <div class="location-badge">
        <div class="badge-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M22 4L12 14.01l-3-3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="badge-text">
          <span class="badge-title">{{ isRtl ? 'نقطة التسليم' : 'Drop-off Point' }}</span>
          <span class="badge-subtitle">{{ isRtl ? 'الخطوة الأخيرة' : 'Final step reached' }}</span>
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
        {{ deliveryConfirmed 
          ? (isRtl ? 'تم تأكيد التوصيل!' : 'Delivery Confirmed!') 
          : (isRtl ? 'لقد وصلت إلى نقطة التسليم.' : 'You have reached the drop-off point.') 
        }}
      </h1>
      
      <!-- Arabic subtitle (bilingual display when in English) -->
      <p v-if="!isRtl && !deliveryConfirmed" class="success-subtitle-ar">وصلت إلى نقطة التسليم.</p>
      
      <p class="success-message">
        {{ deliveryConfirmed 
          ? (isRtl ? 'شكرًا لك على استخدام Arriveo.' : 'Thank you for using Arriveo.') 
          : (isRtl ? 'يرجى تأكيد التوصيل أدناه.' : 'Please confirm your delivery below.') 
        }}
      </p>
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
        <span>{{ isConfirming ? (isRtl ? 'جاري التأكيد...' : 'Confirming...') : (isRtl ? 'تأكيد التوصيل' : 'Confirm Delivery') }}</span>
      </button>

      <p v-if="!deliveryConfirmed" class="whatsapp-hint">
        <svg class="whatsapp-hint-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>{{ isRtl ? 'سيفتح واتساب لإرسال صورة التوصيل للمستلم' : 'This will open WhatsApp to send a delivery photo to the recipient' }}</span>
      </p>

      <button class="action-button action-button--contact" @click="handleContactRecipient">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>{{ isRtl ? 'تواصل مع المستلم' : 'Contact Recipient' }}</span>
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

.header-icon {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  background-color: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.header-title {
  flex: 1;
  font-size: var(--font-size-base);
  font-weight: 500;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-spacer {
  width: 32px;
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
  color: #6b7280;
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

.success-subtitle-ar {
  font-size: var(--font-size-base);
  color: var(--color-text-muted);
  margin: 0 0 var(--spacing-md) 0;
  direction: rtl;
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
</style>
