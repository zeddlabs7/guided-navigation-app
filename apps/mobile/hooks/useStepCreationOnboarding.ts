import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@arriveo/hasSeenStepCreationGuide';

export type OnboardingPhase = 'photo' | 'mark' | 'instruct' | 'save' | 'done';

const PHASE_ORDER: OnboardingPhase[] = ['photo', 'mark', 'instruct', 'save'];

interface UseStepCreationOnboardingReturn {
  /** Current onboarding phase, or 'done' if completed/dismissed. */
  currentPhase: OnboardingPhase;
  /** Whether the onboarding system is active (not yet completed/dismissed). */
  isActive: boolean;
  /** Whether we're still loading the AsyncStorage flag. */
  loading: boolean;
  /** Advance to the next phase. After 'save', marks as done. */
  advance: () => void;
  /** Dismiss all remaining onboarding and mark as done. */
  dismiss: () => void;
  /** Replay the full onboarding sequence (session-only, does not clear AsyncStorage). */
  replay: () => void;
}

export function useStepCreationOnboarding(
  isEditMode: boolean,
): UseStepCreationOnboardingReturn {
  const [currentPhase, setCurrentPhase] = useState<OnboardingPhase>('done');
  const [loading, setLoading] = useState(true);
  const hasPersistedRef = useRef(false);

  useEffect(() => {
    if (isEditMode) {
      setCurrentPhase('done');
      setLoading(false);
      return;
    }

    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (cancelled) return;
        if (value === 'true') {
          setCurrentPhase('done');
        } else {
          setCurrentPhase('photo');
        }
      })
      .catch(() => {
        if (!cancelled) setCurrentPhase('done');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
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
    loading,
    advance,
    dismiss,
    replay,
  };
}
