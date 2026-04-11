<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { OverlayTutorialType } from '../composables/useTutorialState';

interface Props {
  visible: boolean;
  type?: OverlayTutorialType;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'arrow',
});

const emit = defineEmits<{
  complete: [];
  skip: [];
}>();

const currentStep = ref(0);

interface TutorialStep {
  title: string;
  description: string;
  icon: string;
  forTypes: OverlayTutorialType[];
}

const allSteps: TutorialStep[] = [
  {
    title: 'Drag to Move',
    description: 'Drag the overlay to reposition it on the image.',
    icon: 'drag',
    forTypes: ['arrow', 'marker'],
  },
  {
    title: 'Resize',
    description: 'Use the bottom handle to make the arrow larger or smaller.',
    icon: 'resize',
    forTypes: ['arrow'],
  },
  {
    title: 'Rotate',
    description: 'Use the top handle to rotate the arrow to point in any direction.',
    icon: 'rotate',
    forTypes: ['arrow'],
  },
  {
    title: 'Add Label',
    description: 'Tap the edit button in the toolbar to add a label to your marker.',
    icon: 'label',
    forTypes: ['marker'],
  },
];

const steps = computed(() => 
  allSteps.filter(step => step.forTypes.includes(props.type))
);

const totalSteps = computed(() => steps.value.length);
const isLastStep = computed(() => currentStep.value === totalSteps.value - 1);
const currentStepData = computed(() => steps.value[currentStep.value]);

watch(() => props.visible, (newVal) => {
  if (newVal) {
    currentStep.value = 0;
  }
});

watch(() => props.type, () => {
  currentStep.value = 0;
});

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
      <div v-if="visible && currentStepData" class="tutorial-overlay" @click.self="handleSkip">
        <div class="tutorial-modal">
          <button class="tutorial-skip" @click="handleSkip">
            Skip
          </button>
          
          <div class="tutorial-content">
            <div class="tutorial-icon" :class="`tutorial-icon--${currentStepData.icon}`">
              <!-- Drag icon -->
              <svg v-if="currentStepData.icon === 'drag'" width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 9L2 12L5 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M9 5L12 2L15 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M15 19L12 22L9 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M19 9L22 12L19 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 12H22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M12 2V22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              
              <!-- Resize icon -->
              <svg v-else-if="currentStepData.icon === 'resize'" width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 21L15 15M21 21V15M21 21H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M3 3L9 9M3 3V9M3 3H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              
              <!-- Rotate icon -->
              <svg v-else-if="currentStepData.icon === 'rotate'" width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 4V10H7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M3.51 15C4.15 16.82 5.36 18.38 6.96 19.45C8.56 20.53 10.45 21.06 12.37 20.98C14.29 20.89 16.14 20.19 17.66 18.97C19.17 17.76 20.27 16.09 20.79 14.2C21.32 12.32 21.25 10.32 20.6 8.48C19.95 6.64 18.75 5.06 17.17 3.96C15.59 2.86 13.72 2.29 11.81 2.34C9.89 2.38 8.05 3.03 6.51 4.19L1 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              
              <!-- Label icon (for marker) -->
              <svg v-else-if="currentStepData.icon === 'label'" width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            
            <h2 class="tutorial-title">{{ currentStepData.title }}</h2>
            <p class="tutorial-description">{{ currentStepData.description }}</p>
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

.tutorial-icon--label {
  background-color: #fce7f3;
  color: #db2777;
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
