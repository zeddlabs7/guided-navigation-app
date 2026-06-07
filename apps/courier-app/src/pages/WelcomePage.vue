<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useCourierSession } from '@/composables/useCourierSession';
import type { Language } from '@guidenav/types';

const router = useRouter();
const route = useRoute();
const token = route.params.token as string;

const { guidanceSet, setLanguage, translateUserContent, isTranslating } = useCourierSession();

onMounted(() => {
  if (!guidanceSet.value) {
    router.replace(`/g/${token}`);
  }
});

const languages: { code: Language; label: string; rtl: boolean }[] = [
  { code: 'en', label: 'English', rtl: false },
  { code: 'ar', label: 'العربية', rtl: true },
  { code: 'hi', label: 'हिन्दी', rtl: false },
  { code: 'ur', label: 'اردو', rtl: true },
  { code: 'bn', label: 'বাংলা', rtl: false },
];

const ctaTexts: Record<Language, string> = {
  en: 'Click to see location details',
  ar: 'انقر لرؤية تفاصيل الموقع',
  hi: 'स्थान विवरण देखने के लिए क्लिक करें',
  ur: 'مقام کی تفصیلات دیکھنے کے لیے کلک کریں',
  bn: 'অবস্থানের বিবরণ দেখতে ক্লিক করুন',
};

const selectedLanguage = ref<Language | null>(null);
const cycleIndex = ref(0);
let cycleTimer: ReturnType<typeof setInterval> | null = null;

const currentCycleLanguage = computed(() => languages[cycleIndex.value].code);
const currentCycleRtl = computed(() => languages[cycleIndex.value].rtl);

const displayText = computed(() => {
  if (selectedLanguage.value) {
    return ctaTexts[selectedLanguage.value];
  }
  return ctaTexts[currentCycleLanguage.value];
});

const displayRtl = computed(() => {
  if (selectedLanguage.value) {
    return selectedLanguage.value === 'ar' || selectedLanguage.value === 'ur';
  }
  return currentCycleRtl.value;
});

const isLanguageSelected = computed(() => selectedLanguage.value !== null);
const isProceedDisabled = computed(() => !isLanguageSelected.value || isTranslating.value);

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

function selectLanguage(lang: Language) {
  selectedLanguage.value = lang;
  setLanguage(lang);
  stopCycling();
}

async function proceed() {
  if (!selectedLanguage.value) return;
  const lang = selectedLanguage.value;
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
  <div v-if="guidanceSet" class="welcome-page">
    <div class="welcome-content">
      <div class="logo-section">
        <img
          :src="displayRtl ? '/logo-ar.png' : '/logo-eng.png'"
          alt="Arriveo"
          class="logo"
        />
      </div>

      <div class="language-section">
        <div class="language-grid">
          <button
            v-for="lang in languages"
            :key="lang.code"
            class="language-btn"
            :class="{ selected: selectedLanguage === lang.code }"
            :dir="lang.rtl ? 'rtl' : 'ltr'"
            @click="selectLanguage(lang.code)"
          >
            {{ lang.label }}
          </button>
        </div>
      </div>

      <div class="cta-section">
        <button
          class="cta-btn"
          :class="{ disabled: isProceedDisabled }"
          :dir="displayRtl ? 'rtl' : 'ltr'"
          :disabled="isProceedDisabled"
          @click="proceed"
        >
          <Transition name="fade" mode="out-in">
            <span v-if="isTranslating" key="translating" class="cta-text">...</span>
            <span v-else :key="displayText" class="cta-text">{{ displayText }}</span>
          </Transition>
          <svg
            class="cta-arrow"
            :class="{ 'cta-arrow-rtl': displayRtl }"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5 12h14M12 5l7 7-7 7"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
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
  gap: 48px;
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
  padding: 12px 24px;
  border-radius: 999px;
  border: 2px solid #d1d5db;
  background: white;
  color: #374151;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
  min-width: 100px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.language-btn:hover {
  border-color: #16a34a;
  background: #f0fdf4;
}

.language-btn.selected {
  border-color: #16a34a;
  background: #16a34a;
  color: white;
  box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
}

.cta-section {
  width: 100%;
}

.cta-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px 24px;
  border-radius: 16px;
  border: none;
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  outline: none;
  background: #16a34a;
  color: white;
  box-shadow: 0 4px 14px rgba(22, 163, 74, 0.35);
  min-height: 60px;
}

.cta-btn:not(.disabled):hover {
  background: #15803d;
  box-shadow: 0 6px 20px rgba(22, 163, 74, 0.4);
  transform: translateY(-1px);
}

.cta-btn:not(.disabled):active {
  transform: translateY(0);
}

.cta-btn.disabled {
  background: #d1d5db;
  color: #9ca3af;
  cursor: not-allowed;
  box-shadow: none;
}

.cta-text {
  display: inline-block;
}

.cta-arrow {
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.cta-arrow-rtl {
  transform: scaleX(-1);
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
