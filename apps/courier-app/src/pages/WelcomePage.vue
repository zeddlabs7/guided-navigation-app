<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useCourierSession } from '@/composables/useCourierSession';
import type { Language } from '@guidenav/types';

const router = useRouter();
const route = useRoute();
const token = route.params.token as string;

const {
  isTokenValid,
  isDataReady,
  dataLoadError,
  setLanguage,
  translateUserContent,
} = useCourierSession();

const waitingForData = ref(false);
const isNavigating = ref(false);

onMounted(() => {
  if (!isTokenValid.value) {
    router.replace(`/g/${token}`);
  }
});

watch(dataLoadError, (err) => {
  if (err) {
    router.replace(`/g/${token}/error?type=${err}`);
  }
});

const languages: { code: Language; label: string; rtl: boolean }[] = [
  { code: 'en', label: 'English', rtl: false },
  { code: 'ar', label: 'العربية', rtl: true },
  { code: 'hi', label: 'हिन्दी', rtl: false },
  { code: 'ur', label: 'اردو', rtl: true },
  { code: 'bn', label: 'বাংলা', rtl: false },
];

const instructionTexts: Record<Language, string> = {
  en: 'Choose your language to enter',
  ar: 'اختر لغتك للدخول',
  hi: 'प्रवेश के लिए अपनी भाषा चुनें',
  ur: 'داخل ہونے کے لیے اپنی زبان منتخب کریں',
  bn: 'প্রবেশ করতে আপনার ভাষা নির্বাচন করুন',
};

const selectedLanguage = ref<Language | null>(null);
const cycleIndex = ref(0);
let cycleTimer: ReturnType<typeof setInterval> | null = null;

const currentCycleLanguage = computed(() => languages[cycleIndex.value].code);
const currentCycleRtl = computed(() => languages[cycleIndex.value].rtl);

const instructionText = computed(() => instructionTexts[currentCycleLanguage.value]);
const instructionRtl = computed(() => currentCycleRtl.value);

function startCycling() {
  cycleTimer = setInterval(() => {
    cycleIndex.value = (cycleIndex.value + 1) % languages.length;
  }, 2000);
}

function stopCycling() {
  if (cycleTimer) {
    clearInterval(cycleTimer);
    cycleTimer = null;
  }
}

async function selectLanguage(lang: Language) {
  if (isNavigating.value) return;

  selectedLanguage.value = lang;
  setLanguage(lang);
  stopCycling();
  isNavigating.value = true;

  if (!isDataReady.value) {
    waitingForData.value = true;
    await new Promise<void>((resolve) => {
      const unwatch = watch(isDataReady, (ready) => {
        if (ready) {
          unwatch();
          waitingForData.value = false;
          resolve();
        }
      }, { immediate: true });
    });
  }

  if (lang !== 'en') {
    await translateUserContent();
  }
  router.push(`/g/${token}/landing`);
}

onMounted(() => {
  startCycling();
});

onUnmounted(() => {
  stopCycling();
});
</script>

<template>
  <div v-if="isTokenValid" class="welcome-page">
    <div class="welcome-content">
      <div class="logo-section">
        <img
          :src="instructionRtl ? '/logo-ar.png' : '/logo-eng.png'"
          alt="Arriveo"
          class="logo"
        />
      </div>

      <div class="instruction-section">
        <Transition name="fade" mode="out-in">
          <p
            :key="instructionText"
            class="instruction-text"
            :dir="instructionRtl ? 'rtl' : 'ltr'"
          >
            {{ instructionText }}
          </p>
        </Transition>
      </div>

      <div class="language-section">
        <div class="language-grid">
          <button
            v-for="lang in languages"
            :key="lang.code"
            class="language-btn"
            :class="{
              selected: selectedLanguage === lang.code,
              loading: selectedLanguage === lang.code && isNavigating,
            }"
            :dir="lang.rtl ? 'rtl' : 'ltr'"
            :disabled="isNavigating"
            @click="selectLanguage(lang.code)"
          >
            <span v-if="selectedLanguage === lang.code && isNavigating" class="spinner" />
            <span v-else>{{ lang.label }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.welcome-page {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0fdf4 0%, #ecfeff 50%, #f0f9ff 100%);
  padding: 24px;
}

.welcome-content {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40px;
}

.logo-section {
  display: flex;
  justify-content: center;
}

.logo {
  height: 48px;
  width: auto;
  object-fit: contain;
}

.instruction-section {
  text-align: center;
  min-height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.instruction-text {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.language-section {
  width: 100%;
}

.language-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
}

.language-btn {
  padding: 14px 28px;
  border-radius: 999px;
  border: 2px solid #d1d5db;
  background: white;
  color: #374151;
  font-size: 17px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
  min-width: 110px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 50px;
}

.language-btn:not(:disabled):hover {
  border-color: #16a34a;
  background: #f0fdf4;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.language-btn:not(:disabled):active {
  transform: translateY(0);
}

.language-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.language-btn.selected {
  border-color: #16a34a;
  background: #16a34a;
  color: white;
  box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
}

.language-btn.loading {
  pointer-events: none;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
