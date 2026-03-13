<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { GButton, GCard, GInput } from '@guidenav/ui';

const router = useRouter();
const email = ref('');
const loading = ref(false);

async function handleLogin() {
  loading.value = true;
  // TODO: Implement Firebase Auth
  setTimeout(() => {
    loading.value = false;
    router.push('/dashboard');
  }, 1000);
}
</script>

<template>
  <div class="login-page">
    <div class="login-container">
      <header class="login-header">
        <h1 class="login-title">Delivery Guidance</h1>
        <p class="login-subtitle">Sign in to manage your delivery guidance</p>
      </header>

      <GCard padding="lg">
        <form class="login-form" @submit.prevent="handleLogin">
          <GInput
            v-model="email"
            type="email"
            label="Email"
            placeholder="Enter your email"
          />

          <GButton
            type="submit"
            variant="primary"
            full-width
            :loading="loading"
          >
            Continue
          </GButton>
        </form>
      </GCard>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-md);
}

.login-container {
  width: 100%;
  max-width: 400px;
}

.login-header {
  text-align: center;
  margin-bottom: var(--spacing-xl);
}

.login-title {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  margin: 0 0 var(--spacing-sm) 0;
  color: var(--color-primary);
}

.login-subtitle {
  color: var(--color-text-muted);
  margin: 0;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}
</style>
