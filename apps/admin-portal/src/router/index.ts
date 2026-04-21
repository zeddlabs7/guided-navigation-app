import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/pages/DashboardPage.vue'),
  },
  {
    path: '/users',
    name: 'Users',
    component: () => import('@/pages/UsersPage.vue'),
  },
  {
    path: '/guidance',
    name: 'Guidance',
    component: () => import('@/pages/GuidancePage.vue'),
  },
  {
    path: '/deliveries',
    name: 'Deliveries',
    component: () => import('@/pages/DeliveriesPage.vue'),
  },
  {
    path: '/feedback',
    name: 'Feedback',
    component: () => import('@/pages/FeedbackPage.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
