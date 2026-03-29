<script setup lang="ts">
import { ref, computed } from 'vue';

interface Props {
  visible: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  complete: [];
  skip: [];
}>();

const currentStep = ref(0);

const steps = [
  {
    title: 'Tap to Place',
    description: 'Tap anywhere on the image to place an arrow or marker.',
    icon: 'tap',
  },
  {
    title: 'Drag to Move',
    description: 'Drag the overlay to reposition it on the image.',
    icon: 'drag',
  },
  {
    title: 'Resize',
    description: 'Use the bottom handle to make the overlay larger or smaller.',
    icon: 'resize',
  },
  {
    title: 'Rotate',
    description: 'Use the top handle to rotate arrows to point in any direction.',
    icon: 'rotate',
  },
];

const totalSteps = computed(() => steps.length);
const isLastStep = computed(() => currentStep.value === totalSteps.value - 1);

function handleNext() {
  if (isLastStep.value) {
    emit('complete');
    currentStep.value = 0;
  } else {
    currentStep.value++;
  }
}

function handleBack() {
  if (currentStep.value > 0) {
    currentStep.value--;
  }
}

function handleSkip() {
  emit('skip');
  currentStep.value = 0;
}
</script>

<template>
  <Teleport to="body">
    <Transition name="tutorial-overlay">
      <div v-if="visible" class="tutorial-overlay" @click.self="handleSkip">
        <div class="tutorial-modal">
          <button class="tutorial-skip" @click="handleSkip">
            Skip
          </button>
          
          <div class="tutorial-content">
            <div class="tutorial-icon" :class="`tutorial-icon--${steps[currentStep].icon}`">
              <!-- Tap icon -->
              <svg v-if="steps[currentStep].icon === 'tap'" width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 19V14.5M8 14.5V12C8 11.4696 8.21071 10.9609 8.58579 10.5858C8.96086 10.2107 9.46957 10 10 10C10.5304 10 11.0391 10.2107 11.4142 10.5858C11.7893 10.9609 12 11.4696 12 12V13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M12 13V11C12 10.4696 12.2107 9.96086 12.5858 9.58579C12.9609 9.21071 13.4696 9 14 9C14.5304 9 15.0391 9.21071 15.4142 9.58579C15.7893 9.96086 16 10.4696 16 11V13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M16 12V11C16 10.4696 16.2107 9.96086 16.5858 9.58579C16.9609 9.21071 17.4696 9 18 9C18.5304 9 19.0391 9.21071 19.4142 9.58579C19.7893 9.96086 20 10.4696 20 11V17C20 18.5913 19.3679 20.1174 18.2426 21.2426C17.1174 22.3679 15.5913 23 14 23H12C10.9494 23 9.91317 22.7643 8.96803 22.3105C8.0229 21.8568 7.19252 21.1966 6.53786 20.3786L3.13386 16.0299C2.69125 15.4649 2.51058 14.7398 2.63532 14.0339C2.76006 13.328 3.17848 12.7047 3.78786 12.3219L3.87886 12.2679C4.35003 11.9699 4.8964 11.8149 5.45256 11.8214C6.00872 11.8279 6.55137 11.9958 7.01586 12.3039L8 12.9429" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              
              <!-- Drag icon -->
              <svg v-else-if="steps[currentStep].icon === 'drag'" width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 9L2 12L5 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M9 5L12 2L15 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M15 19L12 22L9 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M19 9L22 12L19 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 12H22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M12 2V22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              
              <!-- Resize icon -->
              <svg v-else-if="steps[currentStep].icon === 'resize'" width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 21L15 15M21 21V15M21 21H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M3 3L9 9M3 3V9M3 3H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              
              <!-- Rotate icon -->
              <svg v-else-if="steps[currentStep].icon === 'rotate'" width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 4V10H7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M3.51 15C4.15 16.82 5.36 18.38 6.96 19.45C8.56 20.53 10.45 21.06 12.37 20.98C14.29 20.89 16.14 20.19 17.66 18.97C19.17 17.76 20.27 16.09 20.79 14.2C21.32 12.32 21.25 10.32 20.6 8.48C19.95 6.64 18.75 5.06 17.17 3.96C15.59 2.86 13.72 2.29 11.81 2.34C9.89 2.38 8.05 3.03 6.51 4.19L1 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            
            <h2 class="tutorial-title">{{ steps[currentStep].title }}</h2>
            <p class="tutorial-description">{{ steps[currentStep].description }}</p>
          </div>
          
          <div class="tutorial-pagination">
            <span
              v-for="(_, index) in steps"
              :key="index"
              class="tutorial-dot"
              :class="{ 'tutorial-dot--active': index === currentStep }"
            />
          </div>
          
          <div class="tutorial-actions">
            <button
              v-if="currentStep > 0"
              class="tutorial-btn tutorial-btn--secondary"
              @click="handleBack"
            >
              Back
            </button>
            <button
              class="tutorial-btn tutorial-btn--primary"
              @click="handleNext"
            >
              {{ isLastStep ? 'Got it!' : 'Next' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.tutorial-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.tutorial-modal {
  background-color: white;
  border-radius: 20px;
  padding: 24px;
  max-width: 320px;
  width: 100%;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.tutorial-skip {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 14px;
  font-weight: 500;
  color: #99a1af;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.15s ease;
}

.tutorial-skip:hover {
  background-color: #f3f4f6;
  color: #4a5565;
}

.tutorial-content {
  text-align: center;
  padding: 16px 0;
}

.tutorial-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  background-color: #eff6ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #155dfc;
}

.tutorial-icon--rotate {
  background-color: #fef3c7;
  color: #d97706;
}

.tutorial-icon--resize {
  background-color: #dcfce7;
  color: #16a34a;
}

.tutorial-title {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 600;
  color: #101828;
}

.tutorial-description {
  margin: 0;
  font-size: 15px;
  color: #6a7282;
  line-height: 1.5;
}

.tutorial-pagination {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin: 20px 0;
}

.tutorial-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #e5e7eb;
  transition: all 0.2s ease;
}

.tutorial-dot--active {
  background-color: #155dfc;
  width: 24px;
  border-radius: 4px;
}

.tutorial-actions {
  display: flex;
  gap: 12px;
}

.tutorial-btn {
  flex: 1;
  padding: 14px 20px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tutorial-btn--primary {
  background-color: #155dfc;
  border: none;
  color: white;
}

.tutorial-btn--primary:hover {
  background-color: #1249d6;
}

.tutorial-btn--secondary {
  background-color: white;
  border: 1px solid #e5e7eb;
  color: #4a5565;
}

.tutorial-btn--secondary:hover {
  background-color: #f3f4f6;
  border-color: #d1d5db;
}

.tutorial-overlay-enter-active,
.tutorial-overlay-leave-active {
  transition: all 0.3s ease;
}

.tutorial-overlay-enter-from,
.tutorial-overlay-leave-to {
  opacity: 0;
}

.tutorial-overlay-enter-from .tutorial-modal,
.tutorial-overlay-leave-to .tutorial-modal {
  transform: scale(0.95) translateY(10px);
  opacity: 0;
}

.tutorial-overlay-enter-active .tutorial-modal,
.tutorial-overlay-leave-active .tutorial-modal {
  transition: all 0.3s ease;
}
</style>
