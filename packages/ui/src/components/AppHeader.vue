<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

interface Props {
  showNewButton?: boolean;
  showLanguageToggle?: boolean;
  showUserMenu?: boolean;
  currentLanguage?: 'en' | 'ar';
  logoutLabel?: string;
}

withDefaults(defineProps<Props>(), {
  showNewButton: true,
  showLanguageToggle: true,
  showUserMenu: true,
  currentLanguage: 'en',
  logoutLabel: 'Log Out',
});

const emit = defineEmits<{
  'new-click': [];
  'language-toggle': [];
  'logo-click': [];
  'logout': [];
}>();

const menuOpen = ref(false);
const menuRef = ref<HTMLElement | null>(null);

function toggleMenu() {
  menuOpen.value = !menuOpen.value;
}

function handleLogout() {
  menuOpen.value = false;
  emit('logout');
}

function handleClickOutside(event: MouseEvent) {
  if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
    menuOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
  <header class="app-header">
    <button class="app-header__logo" @click="emit('logo-click')" aria-label="Home">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L4 7V22H20V7L12 2Z" fill="white" stroke="white" stroke-width="2" stroke-linejoin="round"/>
        <path d="M3 11L12 4L21 11" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 22V14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>
    
    <div class="app-header__spacer" />
    
    <button 
      v-if="showLanguageToggle"
      class="app-header__lang-btn"
      @click="emit('language-toggle')"
    >
      {{ currentLanguage === 'en' ? 'عربي' : 'EN' }}
    </button>
    
    <button 
      v-if="showNewButton"
      class="app-header__new-btn"
      @click="emit('new-click')"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span>New</span>
    </button>

    <div v-if="showUserMenu" ref="menuRef" class="app-header__user-menu">
      <button 
        class="app-header__user-btn"
        :class="{ 'app-header__user-btn--active': menuOpen }"
        @click.stop="toggleMenu"
        aria-label="User menu"
        aria-haspopup="true"
        :aria-expanded="menuOpen"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="2"/>
          <path d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
      
      <Transition name="menu">
        <div v-if="menuOpen" class="app-header__dropdown">
          <button class="app-header__dropdown-item app-header__dropdown-item--danger" @click="handleLogout">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M16 17L21 12L16 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M21 12H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>{{ logoutLabel }}</span>
          </button>
        </div>
      </Transition>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0 1rem;
  height: 56px;
  background-color: var(--color-surface);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: var(--shadow-md);
  position: sticky;
  top: 0;
  z-index: 100;
}

.app-header__logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background-color: var(--color-primary);
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  color: white;
  transition: background-color 0.2s ease;
}

.app-header__logo:hover {
  background-color: var(--color-primary-dark);
}

.app-header__logo svg {
  color: var(--color-primary);
}

.app-header__spacer {
  flex: 1;
}

.app-header__lang-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  padding: 0 12px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  font-family: var(--font-family-arabic);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.app-header__lang-btn:hover {
  background-color: var(--color-background);
  border-color: var(--color-secondary-dark);
}

.app-header__new-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 16px;
  background-color: var(--color-primary);
  border: none;
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: white;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.app-header__new-btn:hover {
  background-color: var(--color-primary-dark);
}

.app-header__new-btn svg {
  flex-shrink: 0;
}

.app-header__user-menu {
  position: relative;
}

.app-header__user-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 50%;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.app-header__user-btn:hover,
.app-header__user-btn--active {
  background-color: var(--color-background);
  border-color: var(--color-text-muted);
  color: var(--color-text);
}

.app-header__dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 160px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: 6px;
  z-index: 200;
}

.app-header__dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  background: none;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
  cursor: pointer;
  transition: background-color 0.15s ease;
  text-align: left;
}

.app-header__dropdown-item:hover {
  background-color: var(--color-background);
}

.app-header__dropdown-item--danger {
  color: var(--color-error, #dc2626);
}

.app-header__dropdown-item--danger:hover {
  background-color: rgba(220, 38, 38, 0.08);
}

.menu-enter-active,
.menu-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.menu-enter-from,
.menu-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
