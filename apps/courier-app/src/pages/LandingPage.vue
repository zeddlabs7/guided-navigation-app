<script setup lang="ts">
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useCourierSession } from '@/composables/useCourierSession';
import { openMapsWithCoordinates } from '@/utils/contact';

const router = useRouter();
const route = useRoute();
const token = route.params.token as string;

const { currentLanguage, getDestinationCoordinates } = useCourierSession();

const isRtl = computed(() => currentLanguage.value === 'ar');

function handleStartGuide() {
  router.push(`/g/${token}/step/0`);
}

function handleOpenMaps() {
  const coords = getDestinationCoordinates();
  if (coords) {
    openMapsWithCoordinates(coords.latitude, coords.longitude);
  } else {
    window.open('https://maps.google.com', '_blank');
  }
}
</script>

<template>
  <div class="landing-page" :dir="isRtl ? 'rtl' : 'ltr'">
    <div class="landing-content">
      <div class="landing-header">
        <div class="location-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
          </svg>
        </div>
        <h1 class="landing-title">Arriveo</h1>
        <p class="landing-subtitle">{{ isRtl ? 'اختر خيارًا للمتابعة' : 'Choose an option to continue' }}</p>
      </div>

      <div class="landing-actions">
        <button class="action-card action-card--primary" @click="handleStartGuide">
          <div class="action-icon action-icon--primary">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
            </svg>
          </div>
          <div class="action-content">
            <span class="action-title">{{ isRtl ? 'ابدأ التنقل' : 'Start Navigation' }}</span>
            <span class="action-description">{{ isRtl ? 'عرض تعليمات التوصيل خطوة بخطوة' : 'View step-by-step delivery instructions' }}</span>
          </div>
        </button>

        <button class="action-card action-card--secondary" @click="handleOpenMaps">
          <div class="action-icon action-icon--secondary">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.5 4.5L9 2L15 4.5L21.27 2.15C21.74 1.97 22.25 2.31 22.25 2.81V19.5C22.25 19.79 22.08 20.05 21.82 20.17L15 22.5L9 20L2.73 22.35C2.26 22.53 1.75 22.19 1.75 21.69V5C1.75 4.71 1.92 4.45 2.18 4.33L2.5 4.5ZM15 19.5V6.5L9 4.5V17.5L15 19.5Z" fill="currentColor"/>
            </svg>
          </div>
          <div class="action-content">
            <span class="action-title">{{ isRtl ? 'افتح الخرائط' : 'Open Maps' }}</span>
            <span class="action-description">{{ isRtl ? 'تنقل باستخدام تطبيق الخرائط المفضل لديك' : 'Navigate using your preferred maps app' }}</span>
          </div>
        </button>
      </div>

      <div class="landing-footer">
        <p class="help-text">{{ isRtl ? 'تحتاج مساعدة؟ تواصل مع المرسل للحصول على المساعدة' : 'Need help? Contact the sender for assistance' }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.landing-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
  padding: var(--spacing-lg);
}

.landing-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 400px;
  margin: 0 auto;
  width: 100%;
}

.landing-header {
  text-align: center;
  padding-top: var(--spacing-2xl);
  padding-bottom: var(--spacing-xl);
}

.location-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--spacing-lg);
}

.landing-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 var(--spacing-sm) 0;
}

.landing-subtitle {
  font-size: var(--font-size-base);
  color: var(--color-text-muted);
  margin: 0;
}

.landing-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding: var(--spacing-lg) 0;
}

.action-card {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
  border: none;
  cursor: pointer;
  text-align: start;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.action-card:active {
  transform: scale(0.98);
}

.action-card--primary {
  background-color: var(--color-primary);
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.action-card--primary:hover {
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
}

.action-card--secondary {
  background-color: white;
  color: var(--color-text);
  border: 1px solid var(--color-border);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.action-card--secondary:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.action-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.action-icon--primary {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
}

.action-icon--secondary {
  background-color: var(--color-primary-light);
  color: var(--color-primary);
}

.action-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.action-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
}

.action-card--secondary .action-title {
  color: var(--color-text);
}

.action-description {
  font-size: var(--font-size-sm);
  opacity: 0.85;
  line-height: 1.4;
}

.action-card--secondary .action-description {
  color: var(--color-text-muted);
}

.landing-footer {
  margin-top: auto;
  padding: var(--spacing-xl) 0;
  text-align: center;
}

.help-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin: 0;
}

[dir="rtl"] .action-card {
  text-align: right;
}
</style>
