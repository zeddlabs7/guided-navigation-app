import { createApp } from 'vue';
import { createI18nInstance } from '@guidenav/i18n';
import App from './App.vue';
import '@guidenav/ui/styles';
import './styles/main.css';

const app = createApp(App);
const i18n = createI18nInstance('en');

app.use(i18n);

app.mount('#app');
