<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { GButton, GCard } from '@guidenav/ui';
import { useAuth } from '@/composables/useAuth';

const router = useRouter();
const { phoneNumber, logout, isLoading } = useAuth();
const language = ref('en');

function handleBack() {
  router.push('/dashboard');
}

async function handleLogout() {
  await logout();
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
        <div class="setting-section">
          <p class="setting-label">Account</p>
          <p v-if="phoneNumber" class="setting-value">{{ phoneNumber }}</p>
          <GButton 
            variant="danger" 
            :loading="isLoading"
            @click="handleLogout"
          >
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

.setting-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.setting-label {
  font-weight: 500;
  margin: 0;
}

.setting-value {
  color: var(--color-text-muted);
  margin: 0;
  font-size: var(--font-size-sm);
}

.setting-select {
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
}
</style>
