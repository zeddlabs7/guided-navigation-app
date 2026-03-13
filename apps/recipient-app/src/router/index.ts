import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/LoginPage.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/pages/DashboardPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/guidance/new',
    name: 'CreateGuidance',
    component: () => import('@/pages/CreateGuidancePage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/guidance/:guidanceSetId/edit',
    name: 'EditGuidance',
    component: () => import('@/pages/EditGuidancePage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/guidance/:guidanceSetId/steps',
    name: 'StepBuilder',
    component: () => import('@/pages/StepBuilderPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/guidance/:guidanceSetId/preview',
    name: 'Preview',
    component: () => import('@/pages/PreviewPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/guidance/:guidanceSetId/share',
    name: 'ShareLink',
    component: () => import('@/pages/ShareLinkPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/pages/SettingsPage.vue'),
    meta: { requiresAuth: true },
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
