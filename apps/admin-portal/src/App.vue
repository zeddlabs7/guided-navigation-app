<script setup lang="ts">
import { RouterView } from 'vue-router';
import AdminSidebar from './components/AdminSidebar.vue';
</script>

<template>
  <div class="admin-layout">
    <AdminSidebar />
    <main class="admin-main">
      <RouterView />
    </main>
  </div>
</template>

<style>
html,
body,
#app {
  height: 100%;
  margin: 0;
  padding: 0;
}

.admin-layout {
  display: flex;
  height: 100%;
  background-color: var(--color-background);
}

.admin-main {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-lg);
}
</style>
