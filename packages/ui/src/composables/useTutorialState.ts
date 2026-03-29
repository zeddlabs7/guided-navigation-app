import { ref, onMounted, onUnmounted } from 'vue';

export function useTutorialState(userId: string) {
  const STORAGE_KEY = `overlay-tutorial-seen:${userId}`;
  
  const hasSeenTutorial = ref(false);
  
  onMounted(() => {
    hasSeenTutorial.value = localStorage.getItem(STORAGE_KEY) === 'true';
  });
  
  function markTutorialSeen() {
    localStorage.setItem(STORAGE_KEY, 'true');
    hasSeenTutorial.value = true;
  }
  
  function resetTutorial() {
    localStorage.removeItem(STORAGE_KEY);
    hasSeenTutorial.value = false;
  }
  
  return { hasSeenTutorial, markTutorialSeen, resetTutorial };
}

export function useIsMobile() {
  const isMobile = ref(false);
  
  function checkMobile() {
    isMobile.value = window.matchMedia('(max-width: 768px)').matches 
      || 'ontouchstart' in window;
  }
  
  onMounted(() => {
    checkMobile();
    window.addEventListener('resize', checkMobile);
  });
  
  onUnmounted(() => {
    window.removeEventListener('resize', checkMobile);
  });
  
  return { isMobile };
}
