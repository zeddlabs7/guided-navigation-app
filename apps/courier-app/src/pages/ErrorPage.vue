<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCourierSession } from '@/composables/useCourierSession';
import { openWhatsApp } from '@/utils/contact';

const route = useRoute();
const router = useRouter();
const token = route.params.token as string;
const errorType = route.query.type as string | undefined;

const { currentLanguage, getRecipientPhoneNumber } = useCourierSession();

const isRtl = computed(() => currentLanguage.value === 'ar');

interface ErrorConfig {
  titleEn: string;
  titleAr: string;
  messageEn: string;
  messageAr: string;
  statusEn: string;
  statusAr: string;
}

const errorMessages: Record<string, ErrorConfig> = {
  EXPIRED: {
    titleEn: 'This guidance link has expired.',
    titleAr: 'انتهت صلاحية رابط الإرشاد هذا.',
    messageEn: 'The sender may have disabled or removed this guidance. Please contact the recipient for an updated link.',
    messageAr: 'ربما قام المرسل بتعطيل أو إزالة هذا الإرشاد. يرجى الاتصال بالمستلم للحصول على رابط محدث.',
    statusEn: 'Link status: Expired',
    statusAr: 'حالة الرابط: منتهي الصلاحية',
  },
  REVOKED: {
    titleEn: 'This guidance link has been revoked.',
    titleAr: 'تم إلغاء رابط الإرشاد هذا.',
    messageEn: 'The sender has revoked access to this guidance. Please contact the recipient for a new link.',
    messageAr: 'قام المرسل بإلغاء الوصول إلى هذا الإرشاد. يرجى الاتصال بالمستلم للحصول على رابط جديد.',
    statusEn: 'Link status: Revoked',
    statusAr: 'حالة الرابط: ملغى',
  },
  NOT_FOUND: {
    titleEn: 'Invalid guidance link.',
    titleAr: 'رابط إرشاد غير صالح.',
    messageEn: 'This link does not exist or has been removed. Check your link and try again.',
    messageAr: 'هذا الرابط غير موجود أو تمت إزالته. تحقق من الرابط وحاول مرة أخرى.',
    statusEn: 'Link status: Invalid',
    statusAr: 'حالة الرابط: غير صالح',
  },
  GUIDANCE_DISABLED: {
    titleEn: 'This guidance is currently disabled.',
    titleAr: 'هذا الإرشاد معطل حاليًا.',
    messageEn: 'The sender has temporarily disabled this guidance. Please contact the recipient.',
    messageAr: 'قام المرسل بتعطيل هذا الإرشاد مؤقتًا. يرجى الاتصال بالمستلم.',
    statusEn: 'Link status: Disabled',
    statusAr: 'حالة الرابط: معطل',
  },
  NO_STEPS: {
    titleEn: 'No steps available.',
    titleAr: 'لا توجد خطوات متاحة.',
    messageEn: 'This guidance has no steps configured yet. Please contact the recipient.',
    messageAr: 'لم يتم تكوين أي خطوات لهذا الإرشاد بعد. يرجى الاتصال بالمستلم.',
    statusEn: 'Link status: Incomplete',
    statusAr: 'حالة الرابط: غير مكتمل',
  },
  LOAD_FAILED: {
    titleEn: 'Something went wrong.',
    titleAr: 'حدث خطأ ما.',
    messageEn: 'We could not load the guidance. Please check your connection and try again.',
    messageAr: 'لم نتمكن من تحميل الإرشاد. يرجى التحقق من الاتصال والمحاولة مرة أخرى.',
    statusEn: 'Link status: Error',
    statusAr: 'حالة الرابط: خطأ',
  },
};

const defaultError: ErrorConfig = {
  titleEn: 'Something went wrong.',
  titleAr: 'حدث خطأ ما.',
  messageEn: 'We could not load the guidance. Please try again or contact the sender.',
  messageAr: 'لم نتمكن من تحميل الإرشاد. يرجى المحاولة مرة أخرى أو الاتصال بالمرسل.',
  statusEn: 'Link status: Error',
  statusAr: 'حالة الرابط: خطأ',
};

const errorConfig = computed(() => {
  return errorMessages[errorType || ''] || defaultError;
});

const title = computed(() => isRtl.value ? errorConfig.value.titleAr : errorConfig.value.titleEn);
const message = computed(() => isRtl.value ? errorConfig.value.messageAr : errorConfig.value.messageEn);
const status = computed(() => isRtl.value ? errorConfig.value.statusAr : errorConfig.value.statusEn);

const languageToggleLabel = computed(() => isRtl.value ? 'English' : 'عربي');

const { toggleLanguage } = useCourierSession();

function handleContactRecipient() {
  const phoneNumber = getRecipientPhoneNumber();
  if (phoneNumber) {
    openWhatsApp(phoneNumber);
  }
}

function handleTryAgain() {
  router.push(`/g/${token}`);
}
</script>

<template>
  <div class="error-page" :dir="isRtl ? 'rtl' : 'ltr'">
    <!-- Header -->
    <header class="error-header">
      <div class="header-icon">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 11l18-9-9 18-2-8-7-1z" fill="currentColor"/>
        </svg>
      </div>
      <div class="header-spacer"></div>
      <button class="header-language" @click="toggleLanguage">
        {{ languageToggleLabel }}
      </button>
    </header>

    <!-- Error Content -->
    <div class="error-content">
      <!-- Error Icon -->
      <div class="error-icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M10 14l-2 2M14 10l2-2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>

      <!-- Error Text -->
      <h1 class="error-title">{{ title }}</h1>
      <p class="error-message">{{ message }}</p>

      <!-- Action Buttons -->
      <div class="error-actions">
        <button class="action-button action-button--primary" @click="handleContactRecipient">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>{{ isRtl ? 'تواصل مع المستلم' : 'Contact Recipient' }}</span>
        </button>

        <button class="action-button action-button--secondary" @click="handleTryAgain">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 4V10H7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M3.51 15C4.15 16.82 5.36 18.38 6.96 19.45C8.56 20.53 10.45 21.06 12.37 20.98C14.29 20.89 16.14 20.19 17.66 18.97C19.17 17.76 20.27 16.09 20.79 14.2C21.32 12.32 21.25 10.32 20.6 8.48C19.95 6.64 18.75 5.06 17.17 3.96C15.59 2.86 13.72 2.29 11.81 2.34C9.89 2.38 8.05 3.03 6.51 4.19L1 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>{{ isRtl ? 'حاول مرة أخرى' : 'Try again' }}</span>
        </button>
      </div>

      <!-- Status Indicator -->
      <div class="status-indicator">
        <div class="status-line"></div>
        <span class="status-text">{{ status }}</span>
        <div class="status-line"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.error-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-background);
}

/* Header */
.error-header {
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

.header-spacer {
  flex: 1;
}

.header-language {
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background-color: white;
  font-size: var(--font-size-sm);
  color: var(--color-text);
  cursor: pointer;
  flex-shrink: 0;
}

/* Error Content */
.error-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--spacing-xl) var(--spacing-lg);
}

.error-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: #f3f4f6;
  color: #9ca3af;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--spacing-xl);
}

.error-title {
  font-size: 1.375rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 var(--spacing-md) 0;
  max-width: 300px;
  line-height: 1.3;
}

.error-message {
  font-size: var(--font-size-base);
  color: var(--color-text-muted);
  margin: 0 0 var(--spacing-xl) 0;
  max-width: 320px;
  line-height: 1.5;
}

/* Action Buttons */
.error-actions {
  width: 100%;
  max-width: 320px;
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

.action-button--primary {
  background-color: var(--color-primary);
  color: white;
}

.action-button--primary:hover {
  background-color: var(--color-primary-dark);
}

.action-button--secondary {
  background-color: white;
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.action-button--secondary:hover {
  background-color: var(--color-background);
}

/* Status Indicator */
.status-indicator {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-top: var(--spacing-2xl);
}

.status-line {
  width: 32px;
  height: 1px;
  background-color: var(--color-border);
}

.status-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}
</style>
