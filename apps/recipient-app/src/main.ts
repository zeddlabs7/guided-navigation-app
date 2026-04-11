import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createI18nInstance } from '@guidenav/i18n';
import { initializeFirebase } from '@guidenav/services';
import App from './App.vue';
import router from './router';
import '@guidenav/ui/styles';
import './styles/main.css';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  useEmulators: import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true',
};

if (firebaseConfig.apiKey) {
  initializeFirebase(firebaseConfig);
} else {
  console.error('❌ Firebase API key is missing! Check your .env file.');
}

const app = createApp(App);
const pinia = createPinia();
const i18n = createI18nInstance('en');

app.use(pinia);
app.use(router);
app.use(i18n);

app.mount('#app');
