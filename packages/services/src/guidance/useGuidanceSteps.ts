import { ref, watch, onUnmounted, type Ref, type ComputedRef } from 'vue';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFirebaseFirestore } from '../firebase/config';
import type { GuidanceStep } from '@guidenav/types';

const GUIDANCE_STEPS_COLLECTION = 'guidanceSteps';

export function useGuidanceSteps(
  guidanceSetId: Ref<string | null> | ComputedRef<string | null>
) {
  const steps = ref<GuidanceStep[]>([]);
  const loading = ref(true);
  const error = ref<Error | null>(null);
  let unsubscribe: Unsubscribe | null = null;

  watch(
    guidanceSetId,
    (id: string | null) => {
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }

      if (!id) {
        steps.value = [];
        loading.value = false;
        return;
      }

      loading.value = true;
      error.value = null;

      const db = getFirebaseFirestore();
      const q = query(
        collection(db, GUIDANCE_STEPS_COLLECTION),
        where('guidanceSetId', '==', id),
        where('deletedAt', '==', null),
        orderBy('stepIndex', 'asc')
      );

      unsubscribe = onSnapshot(
        q,
        { includeMetadataChanges: true },
        (snapshot) => {
          steps.value = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as GuidanceStep[];
          loading.value = false;
        },
        (err) => {
          console.error('useGuidanceSteps error:', err);
          error.value = err;
          loading.value = false;
        }
      );
    },
    { immediate: true }
  );

  onUnmounted(() => {
    if (unsubscribe) {
      unsubscribe();
    }
  });

  return { steps, loading, error };
}
