import { ref, onMounted, onUnmounted } from 'vue';

export type OverlayTutorialType = 'arrow' | 'marker';

export function useTutorialState(userId: string, overlayType?: OverlayTutorialType) {
  const suffix = overlayType ? `-${overlayType}` : '';
  const STORAGE_KEY = `overlay-tutorial-seen${suffix}:${userId}`;
  
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

export function useOverlayTutorials(userId: string) {
  const ARROW_KEY = `overlay-tutorial-seen-arrow:${userId}`;
  const MARKER_KEY = `overlay-tutorial-seen-marker:${userId}`;
  
  const hasSeenArrowTutorial = ref(false);
  const hasSeenMarkerTutorial = ref(false);
  
  onMounted(() => {
    hasSeenArrowTutorial.value = localStorage.getItem(ARROW_KEY) === 'true';
    hasSeenMarkerTutorial.value = localStorage.getItem(MARKER_KEY) === 'true';
  });
  
  function markArrowTutorialSeen() {
    localStorage.setItem(ARROW_KEY, 'true');
    hasSeenArrowTutorial.value = true;
  }
  
  function markMarkerTutorialSeen() {
    localStorage.setItem(MARKER_KEY, 'true');
    hasSeenMarkerTutorial.value = true;
  }
  
  function resetArrowTutorial() {
    localStorage.removeItem(ARROW_KEY);
    hasSeenArrowTutorial.value = false;
  }
  
  function resetMarkerTutorial() {
    localStorage.removeItem(MARKER_KEY);
    hasSeenMarkerTutorial.value = false;
  }
  
  return {
    hasSeenArrowTutorial,
    hasSeenMarkerTutorial,
    markArrowTutorialSeen,
    markMarkerTutorialSeen,
    resetArrowTutorial,
    resetMarkerTutorial,
  };
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
