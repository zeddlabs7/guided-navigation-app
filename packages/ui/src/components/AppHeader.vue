<script setup lang="ts">
interface Props {
  showNewButton?: boolean;
  showLanguageToggle?: boolean;
  currentLanguage?: 'en' | 'ar';
}

withDefaults(defineProps<Props>(), {
  showNewButton: true,
  showLanguageToggle: true,
  currentLanguage: 'en',
});

const emit = defineEmits<{
  'new-click': [];
  'language-toggle': [];
  'logo-click': [];
}>();
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
</style>
