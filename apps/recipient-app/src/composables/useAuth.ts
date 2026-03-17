import { ref, computed, onMounted, onUnmounted } from 'vue';
import { getFirebaseAuth } from '@guidenav/services';
import { onAuthStateChanged, type User, type Unsubscribe } from 'firebase/auth';

const user = ref<User | null>(null);
const loading = ref(true);
const initialized = ref(false);

let unsubscribe: Unsubscribe | null = null;

function initAuthListener() {
  if (initialized.value) return;
  
  try {
    const auth = getFirebaseAuth();
    unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      user.value = firebaseUser;
      loading.value = false;
    });
    initialized.value = true;
  } catch {
    loading.value = false;
  }
}

export function useAuth() {
  onMounted(() => {
    initAuthListener();
  });

  onUnmounted(() => {
    // Don't unsubscribe here as other components may still need the listener
  });

  const userId = computed(() => {
    // TODO: Remove this fallback once auth is properly configured
    // For now, use a placeholder user ID for development
    return user.value?.uid ?? 'dev-user-placeholder';
  });

  const isAuthenticated = computed(() => !!user.value);

  const isLoading = computed(() => loading.value);

  return {
    user,
    userId,
    isAuthenticated,
    isLoading,
  };
}
