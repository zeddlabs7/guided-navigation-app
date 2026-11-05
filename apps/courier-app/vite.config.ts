import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3001,
    proxy: {
      '/api/validateToken': {
        target: 'https://validatetoken-txrb6jqctq-wx.a.run.app',
        changeOrigin: true,
        rewrite: () => '/',
      },
      '/api/loadGuidanceData': {
        target: 'https://loadguidancedata-txrb6jqctq-wx.a.run.app',
        changeOrigin: true,
        rewrite: () => '/',
      },
      '/api/translateTexts': {
        target: 'https://translatetexts-txrb6jqctq-wx.a.run.app',
        changeOrigin: true,
        rewrite: () => '/',
      },
    },
  },
});
