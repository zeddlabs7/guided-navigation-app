<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { validateToken } from '@guidenav/services/courier-api';
import { useCourierSession } from '@/composables/useCourierSession';
import type { Language } from '@guidenav/types';

const router = useRouter();
const route = useRoute();
const token = route.params.token as string;

const {
  setLoading,
  setError,
  setToken,
  setTokenValid,
  loadDataInBackground,
  detectLanguage,
} = useCourierSession();

const TRUST_STATEMENTS: Record<Language, string> = {
  en: 'Delivery guidance from your recipient',
  ar: 'إرشادات التوصيل من المستلم',
  hi: 'प्राप्तकर्ता से डिलीवरी मार्गदर्शन',
  ur: 'وصول کنندہ کی طرف سے ڈیلیوری رہنمائی',
  bn: 'প্রাপকের কাছ থেকে ডেলিভারি গাইডেন্স',
};

const earlyLang = detectLanguage() ?? 'en';
const trustStatement = computed(() => TRUST_STATEMENTS[earlyLang]);
const loaderRtl = computed(() => earlyLang === 'ar' || earlyLang === 'ur');
const showTrustStatement = ref(true);

onMounted(async () => {
  setLoading(true);
  setToken(token);

  try {
    const result = await validateToken(token);

    if (!result.valid) {
      const errorType = result.error || 'NOT_FOUND';
      router.replace(`/g/${token}/error?type=${errorType}`);
      return;
    }

    setTokenValid(true);
    loadDataInBackground(token);
    router.replace(`/g/${token}/welcome`);
  } catch (err) {
    console.error('Failed to validate token:', err);
    setError('Failed to load guidance');
    router.replace(`/g/${token}/error?type=LOAD_FAILED`);
  } finally {
    setLoading(false);
  }
});
</script>

<template>
  <div class="loader-page" :dir="loaderRtl ? 'rtl' : 'ltr'">
    <div class="loader-content">
      <img
        :src="loaderRtl ? '/logo-ar.png' : '/logo-eng.png'"
        alt="Arriveo"
        class="loader-logo"
      />
      <Transition name="fade">
        <p v-if="showTrustStatement" class="trust-statement">
          {{ trustStatement }}
        </p>
      </Transition>
      <div class="loader-spinner">
        <span class="spinner" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.loader-page {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0fdf4 0%, #ecfeff 50%, #f0f9ff 100%);
  padding: 24px;
}

.loader-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 24px;
}

.loader-logo {
  height: 44px;
  width: auto;
  object-fit: contain;
}

.trust-statement {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #4b5563;
  line-height: 1.4;
}

.loader-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #e5e7eb;
  border-top-color: #16a34a;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.fade-enter-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
</style>
