import type { CreateAnalyticsEventInput, CreateFeedbackEventInput } from '@guidenav/types';

let initPromise: Promise<void> | null = null;

function ensureFirebaseInitialized(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      const config = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
      };
      if (!config.apiKey) return;
      const { initializeFirebase } = await import('@guidenav/services');
      initializeFirebase(config);
    })();
  }
  return initPromise;
}

export async function logAnalyticsEvent(input: CreateAnalyticsEventInput): Promise<string> {
  await ensureFirebaseInitialized();
  const { logAnalyticsEvent: log } = await import('@guidenav/services');
  return log(input);
}

export async function submitFeedback(input: CreateFeedbackEventInput): Promise<string> {
  await ensureFirebaseInitialized();
  const { submitFeedback: submit } = await import('@guidenav/services');
  return submit(input);
}
