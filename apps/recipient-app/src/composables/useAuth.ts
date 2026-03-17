import { ref, computed } from 'vue';

interface AuthUser {
  uid: string;
}

const user = ref<AuthUser | null>(null);
const loading = ref(false);

export function useAuth() {
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
