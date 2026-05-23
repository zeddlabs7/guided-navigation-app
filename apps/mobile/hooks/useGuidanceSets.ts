import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { GuidanceSet, GuidanceStep, GuidanceStatus } from '@guidenav/types';
import { subscribeToGuidanceSets, getAllStepsForGuidanceSets } from '@/services/guidance';

interface UseGuidanceSetsResult {
  guidanceSets: GuidanceSet[];
  stepsMap: Map<string, GuidanceStep[]>;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  counts: Record<'all' | GuidanceStatus, number>;
}

export function useGuidanceSets(userId: string | undefined): UseGuidanceSetsResult {
  const [rawSets, setRawSets] = useState<GuidanceSet[]>([]);
  const [stepsMap, setStepsMap] = useState<Map<string, GuidanceStep[]>>(new Map());
  const [setsLoading, setSetsLoading] = useState(true);
  const [stepsLoading, setStepsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const subscribe = useCallback(() => {
    if (!userId) {
      setRawSets([]);
      setStepsMap(new Map());
      setSetsLoading(false);
      return;
    }

    setSetsLoading(true);
    setError(null);

    unsubscribeRef.current?.();
    unsubscribeRef.current = subscribeToGuidanceSets(
      userId,
      (sets) => {
        setRawSets(sets);
        setSetsLoading(false);
      },
      (err) => {
        setError(err.message || 'Failed to load guidance sets.');
        setSetsLoading(false);
      },
    );
  }, [userId]);

  useEffect(() => {
    subscribe();
    return () => {
      unsubscribeRef.current?.();
    };
  }, [subscribe]);

  useEffect(() => {
    if (rawSets.length === 0) {
      setStepsMap(new Map());
      return;
    }

    let cancelled = false;
    setStepsLoading(true);

    const setIds = rawSets.map((s) => s.id);
    getAllStepsForGuidanceSets(setIds)
      .then((map) => {
        if (!cancelled) {
          setStepsMap(map);
          setStepsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStepsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [rawSets]);

  const loading = setsLoading || stepsLoading;

  const counts = useMemo(() => {
    const result: Record<'all' | GuidanceStatus, number> = {
      all: rawSets.length,
      DRAFT: 0,
      PUBLISHED: 0,
      DISABLED: 0,
    };
    for (const set of rawSets) {
      result[set.status]++;
    }
    return result;
  }, [rawSets]);

  const refresh = useCallback(() => {
    unsubscribeRef.current?.();
    subscribe();
  }, [subscribe]);

  return {
    guidanceSets: rawSets,
    stepsMap,
    loading,
    error,
    refresh,
    counts,
  };
}
