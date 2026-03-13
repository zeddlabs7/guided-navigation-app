<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { GButton, GCard, GInput } from '@guidenav/ui';

const router = useRouter();
const title = ref('');
const loading = ref(false);

function handleBack() {
  router.back();
}

async function handleCreate() {
  if (!title.value.trim()) return;

  loading.value = true;
  // TODO: Implement create guidance
  setTimeout(() => {
    loading.value = false;
    router.push('/dashboard');
  }, 1000);
}
</script>

<template>
  <div class="page">
    <header class="page-header">
      <GButton variant="ghost" size="sm" @click="handleBack">
        ← Back
      </GButton>
      <h1 class="page-title">Create New Guidance</h1>
    </header>

    <GCard padding="lg">
      <form class="create-form" @submit.prevent="handleCreate">
        <GInput
          v-model="title"
          label="Guidance Title"
          placeholder="e.g., Home Delivery"
        />

        <div class="form-actions">
          <GButton variant="secondary" @click="handleBack">
            Cancel
          </GButton>
          <GButton
            type="submit"
            variant="primary"
            :loading="loading"
            :disabled="!title.trim()"
          >
            Create
          </GButton>
        </div>
      </form>
    </GCard>
  </div>
</template>

<style scoped>
.create-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.form-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: flex-end;
}
</style>
