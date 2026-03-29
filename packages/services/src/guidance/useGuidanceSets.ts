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
import type { GuidanceSet } from '@guidenav/types';

const GUIDANCE_SETS_COLLECTION = 'guidanceSets';

export function useGuidanceSets(userId: Ref<string | null> | ComputedRef<string | null>) {
  const sets = ref<GuidanceSet[]>([]);
  const loading = ref(true);
  const error = ref<Error | null>(null);
  let unsubscribe: Unsubscribe | null = null;

  watch(
    userId,
    (uid: string | null) => {
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }

      if (!uid) {
        sets.value = [];
        loading.value = false;
        return;
      }

      loading.value = true;
      error.value = null;

      const db = getFirebaseFirestore();
      const q = query(
        collection(db, GUIDANCE_SETS_COLLECTION),
        where('recipientUserId', '==', uid),
        where('deletedAt', '==', null),
        orderBy('updatedAt', 'desc')
      );

      unsubscribe = onSnapshot(
        q,
        { includeMetadataChanges: true },
        (snapshot) => {
          sets.value = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as GuidanceSet[];
          loading.value = false;
        },
        (err) => {
          console.error('useGuidanceSets error:', err);
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

  return { sets, loading, error };
}
