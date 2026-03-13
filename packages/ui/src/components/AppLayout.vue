<script setup lang="ts">
import AppHeader from './AppHeader.vue';

interface Props {
  showHeader?: boolean;
  showNewButton?: boolean;
  showLanguageToggle?: boolean;
  currentLanguage?: 'en' | 'ar';
}

withDefaults(defineProps<Props>(), {
  showHeader: true,
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
  <div class="app-layout">
    <AppHeader
      v-if="showHeader"
      :show-new-button="showNewButton"
      :show-language-toggle="showLanguageToggle"
      :current-language="currentLanguage"
      @new-click="emit('new-click')"
      @language-toggle="emit('language-toggle')"
      @logo-click="emit('logo-click')"
    />
    <main class="app-layout__content">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--color-background);
}

.app-layout__content {
  flex: 1;
  display: flex;
  flex-direction: column;
}
</style>
