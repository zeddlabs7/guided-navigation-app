import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@arriveo/hasSeenStepCreationGuide';

export type OnboardingPhase =
  | 'photo'
  | 'mark'
  | 'awaitingMark'
  | 'awaitingImage'
  | 'instruct'
  | 'awaitingInstruction'
  | 'save'
  | 'done';

// Step 1 (photo) is shown before a photo exists. Got it hides the tooltip
// until the photo is added, then step 2 (mark) appears. Step 4 (save) waits
// until the instruction from step 3 has been entered.
const PHASE_ORDER: OnboardingPhase[] = [
  'photo',
  'awaitingImage',
  'mark',
  'awaitingMark',
  'instruct',
  'awaitingInstruction',
  'save',
];

interface UseStepCreationOnboardingReturn {
  /** Current onboarding phase, or 'done' if completed/dismissed. */
  currentPhase: OnboardingPhase;
  /** Whether the onboarding system is active (not yet completed/dismissed). */
  isActive: boolean;
  /** Whether we're still loading the AsyncStorage flag. */
  loading: boolean;
  /** Advance to the next phase. After 'save', marks as done. */
  advance: () => void;
  /** Jump to an exact phase without skipping ahead. */
  setPhase: (phase: OnboardingPhase) => void;
  /** Dismiss all remaining onboarding and mark as done. */
  dismiss: () => void;
  /** Replay the full onboarding sequence (session-only, does not clear AsyncStorage). */
  replay: () => void;
}

export function useStepCreationOnboarding(
  isEditMode: boolean,
  overlayCount = 0,
): UseStepCreationOnboardingReturn {
  const [currentPhase, setCurrentPhase] = useState<OnboardingPhase>(
    isEditMode ? 'done' : 'photo',
  );
  const hasPersistedRef = useRef(false);

  useEffect(() => {
    if (isEditMode) {
      setCurrentPhase('done');
      return;
    }

    // Treat every visit to a new step as the first time, even if this
    // device already finished the guide.
    hasPersistedRef.current = false;
    setCurrentPhase('photo');
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  }, [isEditMode]);

  const persistCompletion = useCallback(() => {
    if (hasPersistedRef.current) return;
    hasPersistedRef.current = true;
    AsyncStorage.setItem(STORAGE_KEY, 'true').catch(() => {});
  }, []);

  const advance = useCallback(() => {
    setCurrentPhase((prev) => {
      const idx = PHASE_ORDER.indexOf(prev);
      if (idx === -1) return prev;
      if (idx >= PHASE_ORDER.length - 1) {
        persistCompletion();
        return 'done';
      }
      return PHASE_ORDER[idx + 1];
    });
  }, [persistCompletion]);

  useEffect(() => {
    if (currentPhase === 'awaitingMark' && overlayCount > 0) {
      advance();
    }
  }, [currentPhase, overlayCount, advance]);

  const setPhase = useCallback((phase: OnboardingPhase) => {
    setCurrentPhase(phase);
  }, []);

  const dismiss = useCallback(() => {
    setCurrentPhase('done');
    persistCompletion();
  }, [persistCompletion]);

  const replay = useCallback(() => {
    setCurrentPhase('photo');
  }, []);

  return {
    currentPhase,
    isActive: currentPhase !== 'done',
    loading: false,
    advance,
    setPhase,
    dismiss,
    replay,
  };
}
