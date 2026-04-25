import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, initializeRecaptchaConfig, type Auth } from 'firebase/auth';
import { initializeFirestore, connectFirestoreEmulator, persistentLocalCache, persistentMultipleTabManager, type Firestore } from 'firebase/firestore';
import { getStorage, connectStorageEmulator, type FirebaseStorage } from 'firebase/storage';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let firestore: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let emulatorsConnected = false;

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  useEmulators?: boolean;
}

let useEmulators = false;

export function initializeFirebase(config: FirebaseConfig): FirebaseApp {
  if (getApps().length === 0) {
    app = initializeApp(config);
  } else {
    app = getApps()[0];
  }
  useEmulators = config.useEmulators ?? false;
  return app;
}

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    throw new Error('Firebase not initialized. Call initializeFirebase() first.');
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
    if (useEmulators && !emulatorsConnected) {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    } else {
      initializeRecaptchaConfig(auth).catch((e) => {
        console.warn('Failed to initialize reCAPTCHA config:', e);
      });
    }
  }
  return auth;
}

export function getFirebaseFirestore(): Firestore {
  if (!firestore) {
    firestore = initializeFirestore(getFirebaseApp(), {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
    if (useEmulators && !emulatorsConnected) {
      connectFirestoreEmulator(firestore, 'localhost', 8080);
    }
  }
  return firestore;
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!storage) {
    storage = getStorage(getFirebaseApp());
    if (useEmulators && !emulatorsConnected) {
      connectStorageEmulator(storage, 'localhost', 9199);
      emulatorsConnected = true;
    }
  }
  return storage;
}
