import { ref, computed, readonly } from 'vue';
import {
  initRecaptchaVerifier,
  clearRecaptchaVerifier,
  sendOTP as sendOTPService,
  verifyOTP as verifyOTPService,
  onAuthStateChange,
  signOut as signOutService,
  getOrCreateUser,
  type User as FirebaseUser,
  type ConfirmationResult,
} from '@guidenav/services';
import type { RecaptchaVerifier } from '@guidenav/services';
import type { User } from '@guidenav/types';

const firebaseUser = ref<FirebaseUser | null>(null);
const appUser = ref<User | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const initialized = ref(false);

let confirmationResult: ConfirmationResult | null = null;
let recaptchaVerifier: RecaptchaVerifier | null = null;
let authInitPromise: Promise<void> | null = null;
let authInitResolve: (() => void) | null = null;

authInitPromise = new Promise((resolve) => {
  authInitResolve = resolve;
});

export function useAuth() {
  const userId = computed(() => {
    return firebaseUser.value?.uid ?? null;
  });

  const isAuthenticated = computed(() => !!firebaseUser.value);
  const isLoading = computed(() => loading.value);
  const authError = computed(() => error.value);
  const phoneNumber = computed(() => firebaseUser.value?.phoneNumber ?? null);

  function initialize() {
    if (initialized.value) return;
    initialized.value = true;

    onAuthStateChange(async (user) => {
      firebaseUser.value = user;
      
      if (user) {
        try {
          appUser.value = await getOrCreateUser(user.uid, user.phoneNumber);
        } catch (e) {
          console.error('Failed to get/create user document:', e);
        }
      } else {
        appUser.value = null;
      }
      
      loading.value = false;
      if (authInitResolve) {
        authInitResolve();
        authInitResolve = null;
      }
    });
  }

  async function waitForAuthInit(): Promise<void> {
    if (!loading.value) return;
    return authInitPromise!;
  }

  function setupRecaptcha(containerId: string) {
    try {
      recaptchaVerifier = initRecaptchaVerifier(containerId);
    } catch (e) {
      console.error('Failed to setup reCAPTCHA:', e);
      error.value = 'Failed to setup verification. Please refresh and try again.';
    }
  }

  async function sendOTP(phoneNumber: string): Promise<boolean> {
    if (!recaptchaVerifier) {
      error.value = 'reCAPTCHA not initialized';
      return false;
    }

    error.value = null;
    loading.value = true;

    try {
      confirmationResult = await sendOTPService(phoneNumber, recaptchaVerifier);
      loading.value = false;
      return true;
    } catch (e: unknown) {
      loading.value = false;
      const firebaseError = e as { code?: string; message?: string };
      
      if (firebaseError.code === 'auth/invalid-phone-number') {
        error.value = 'Invalid phone number format. Please use +1234567890 format.';
      } else if (firebaseError.code === 'auth/too-many-requests') {
        error.value = 'Too many attempts. Please try again later.';
      } else if (firebaseError.code === 'auth/captcha-check-failed') {
        error.value = 'Verification failed. Please refresh and try again.';
      } else if (firebaseError.code === 'auth/network-request-failed') {
        error.value = 'Network error. Please check your connection and try again.';
      } else if (firebaseError.code === 'auth/quota-exceeded') {
        error.value = 'SMS quota exceeded. Please try again later.';
      } else if (firebaseError.code === 'auth/missing-client-identifier') {
        error.value = 'Verification setup error. Please refresh the page and try again.';
      } else if (firebaseError.code === 'auth/operation-not-allowed') {
        error.value = 'Phone authentication is not enabled. Please contact support.';
      } else {
        error.value = firebaseError.message || 'Failed to send verification code. Please try again.';
      }
      
      try {
        clearRecaptchaVerifier();
        recaptchaVerifier = initRecaptchaVerifier('recaptcha-container');
      } catch {
        // Best-effort reCAPTCHA reset
      }
      
      return false;
    }
  }

  async function verifyOTP(code: string): Promise<boolean> {
    if (!confirmationResult) {
      error.value = 'No verification in progress. Please request a new code.';
      return false;
    }

    error.value = null;
    loading.value = true;

    try {
      await verifyOTPService(confirmationResult, code);
      confirmationResult = null;
      loading.value = false;
      return true;
    } catch (e: unknown) {
      loading.value = false;
      const firebaseError = e as { code?: string; message?: string };
      
      if (firebaseError.code === 'auth/invalid-verification-code') {
        error.value = 'Invalid code. Please check and try again.';
      } else if (firebaseError.code === 'auth/code-expired') {
        error.value = 'Code expired. Please request a new one.';
      } else {
        error.value = firebaseError.message || 'Verification failed.';
      }
      
      return false;
    }
  }

  async function logout(): Promise<void> {
    error.value = null;
    try {
      clearRecaptchaVerifier();
      confirmationResult = null;
      await signOutService();
    } catch (e: unknown) {
      const firebaseError = e as { message?: string };
      error.value = firebaseError.message || 'Logout failed.';
    }
  }

  function clearError() {
    error.value = null;
  }

  return {
    user: readonly(firebaseUser),
    appUser: readonly(appUser),
    userId,
    phoneNumber,
    isAuthenticated,
    isLoading,
    error: authError,
    initialize,
    waitForAuthInit,
    setupRecaptcha,
    sendOTP,
    verifyOTP,
    logout,
    clearError,
  };
}
