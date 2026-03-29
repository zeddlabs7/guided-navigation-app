import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { useAuth } from '@/composables/useAuth';
import { getGuidanceSteps, getGuidanceSet } from '@guidenav/services';

function prefetchGuidanceData(guidanceSetId: string) {
  getGuidanceSet(guidanceSetId).catch(() => {});
  getGuidanceSteps(guidanceSetId).catch(() => {});
}

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
    beforeEnter: (to) => {
      prefetchGuidanceData(to.params.guidanceSetId as string);
    },
  },
  {
    path: '/guidance/:guidanceSetId/steps',
    name: 'StepBuilder',
    component: () => import('@/pages/StepBuilderPage.vue'),
    meta: { requiresAuth: true },
    beforeEnter: (to) => {
      getGuidanceSteps(to.params.guidanceSetId as string).catch(() => {});
    },
  },
  {
    path: '/guidance/:guidanceSetId/preview',
    name: 'Preview',
    component: () => import('@/pages/PreviewPage.vue'),
    meta: { requiresAuth: true },
    beforeEnter: (to) => {
      prefetchGuidanceData(to.params.guidanceSetId as string);
    },
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

router.beforeEach(async (to, _from, next) => {
  const { isAuthenticated, isLoading, waitForAuthInit, initialize } = useAuth();
  
  initialize();
  
  if (isLoading.value) {
    await waitForAuthInit();
  }
  
  const requiresAuth = to.meta.requiresAuth !== false;
  
  if (requiresAuth && !isAuthenticated.value) {
    next({ name: 'Login' });
  } else if (to.name === 'Login' && isAuthenticated.value) {
    next({ name: 'Dashboard' });
  } else {
    next();
  }
});

export default router;
