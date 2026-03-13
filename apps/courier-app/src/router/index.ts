import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/g/:token',
    name: 'GuidanceLoader',
    component: () => import('@/pages/GuidanceLoaderPage.vue'),
  },
  {
    path: '/g/:token/step/:index',
    name: 'GuidedPlayback',
    component: () => import('@/pages/GuidedPlaybackPage.vue'),
  },
  {
    path: '/g/:token/complete',
    name: 'Complete',
    component: () => import('@/pages/CompletePage.vue'),
  },
  {
    path: '/g/:token/error',
    name: 'Error',
    component: () => import('@/pages/ErrorPage.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/pages/NotFoundPage.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
