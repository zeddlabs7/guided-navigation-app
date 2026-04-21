<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const navItems = [
  { name: 'Dashboard', path: '/', icon: 'dashboard' },
  { name: 'Users', path: '/users', icon: 'users' },
  { name: 'Guidance', path: '/guidance', icon: 'guidance' },
  { name: 'Deliveries', path: '/deliveries', icon: 'deliveries' },
  { name: 'Feedback', path: '/feedback', icon: 'feedback' },
];

const isActive = (path: string) => {
  if (path === '/') return route.path === '/';
  return route.path.startsWith(path);
};

const navigate = (path: string) => {
  router.push(path);
};
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <div class="logo">
        <span class="logo-icon">A</span>
        <span class="logo-text">Arriveo Admin</span>
      </div>
    </div>
    
    <nav class="sidebar-nav">
      <button
        v-for="item in navItems"
        :key="item.path"
        :class="['nav-item', { 'nav-item--active': isActive(item.path) }]"
        @click="navigate(item.path)"
      >
        <span class="nav-icon">
          <svg v-if="item.icon === 'dashboard'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          <svg v-else-if="item.icon === 'users'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <svg v-else-if="item.icon === 'guidance'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="3 11 22 2 13 21 11 13 3 11" />
          </svg>
          <svg v-else-if="item.icon === 'deliveries'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="1" y="3" width="15" height="13" rx="2" />
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
          </svg>
          <svg v-else-if="item.icon === 'feedback'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </span>
        <span class="nav-label">{{ item.name }}</span>
      </button>
    </nav>
    
    <div class="sidebar-footer">
      <div class="version">v0.1.0</div>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 240px;
  min-width: 240px;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sidebar-header {
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.logo-icon {
  width: 32px;
  height: 32px;
  background: var(--color-primary);
  color: white;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: var(--font-size-lg);
}

.logo-text {
  font-weight: 600;
  font-size: var(--font-size-lg);
  color: var(--color-text);
}

.sidebar-nav {
  flex: 1;
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
  font-weight: 500;
  transition: all 0.15s ease;
  text-align: left;
  width: 100%;
}

.nav-item:hover {
  background: var(--color-background);
  color: var(--color-text);
}

.nav-item--active {
  background: var(--color-primary-bg);
  color: var(--color-primary);
}

.nav-item--active:hover {
  background: var(--color-primary-bg);
  color: var(--color-primary);
}

.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
}

.nav-label {
  flex: 1;
}

.sidebar-footer {
  padding: var(--spacing-md) var(--spacing-lg);
  border-top: 1px solid var(--color-border);
}

.version {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
</style>
