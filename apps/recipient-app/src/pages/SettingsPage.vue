<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { GButton, GCard } from '@guidenav/ui';

const router = useRouter();
const language = ref('en');

function handleBack() {
  router.push('/dashboard');
}

function handleLogout() {
  // TODO: Implement logout
  router.push('/login');
}
</script>

<template>
  <div class="page">
    <header class="page-header">
      <GButton variant="ghost" size="sm" @click="handleBack">
        ← Back
      </GButton>
      <h1 class="page-title">Settings</h1>
    </header>

    <div class="settings-content">
      <GCard padding="lg">
        <div class="setting-item">
          <label class="setting-label">Language</label>
          <select v-model="language" class="setting-select">
            <option value="en">English</option>
            <option value="ar">العربية</option>
          </select>
        </div>
      </GCard>

      <GCard padding="lg">
        <div class="setting-item">
          <p class="setting-label">Account</p>
          <GButton variant="danger" @click="handleLogout">
            Log Out
          </GButton>
        </div>
      </GCard>
    </div>
  </div>
</template>

<style scoped>
.settings-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.setting-label {
  font-weight: 500;
  margin: 0;
}

.setting-select {
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
}
</style>
