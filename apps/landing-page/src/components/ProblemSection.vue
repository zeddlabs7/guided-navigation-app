<script setup lang="ts">
const problems = [
  {
    icon: 'map-pin',
    title: '"I\'m at the entrance, but which building?"',
    description: 'Couriers waste time searching for the right spot in complex locations.'
  },
  {
    icon: 'phone',
    title: '"Let me call you for directions..."',
    description: 'Endless phone calls to explain the same route over and over again.'
  },
  {
    icon: 'clock',
    title: '"Your package was returned to sender"',
    description: 'Failed deliveries mean wasted time, money, and frustration for everyone.'
  }
];
</script>

<template>
  <section class="problem">
    <div class="landing-container">
      <div class="problem__header">
        <span class="problem__label">The Problem</span>
        <h2 class="problem__title">Tired of Unclear Delivery Instructions?</h2>
        <p class="problem__subtitle">
          Every day, deliveries fail because couriers can't find the exact drop-off point. 
          Text directions aren't enough for complex locations.
        </p>
      </div>

      <div class="problem__grid">
        <div v-for="problem in problems" :key="problem.title" class="problem__card">
          <div class="problem__icon">
            <svg v-if="problem.icon === 'map-pin'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <svg v-else-if="problem.icon === 'phone'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h3 class="problem__card-title">{{ problem.title }}</h3>
          <p class="problem__card-desc">{{ problem.description }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.problem {
  background: var(--color-background);
  padding: 5rem 0;
}

.problem__header {
  text-align: center;
  max-width: 640px;
  margin: 0 auto var(--spacing-2xl);
}

.problem__label {
  display: inline-block;
  background: var(--color-warning-bg);
  color: var(--color-warning);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-full);
  margin-bottom: var(--spacing-md);
}

.problem__title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  margin: 0 0 var(--spacing-md);
}

.problem__subtitle {
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.6;
}

.problem__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-lg);
}

.problem__card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  text-align: center;
  transition: transform 0.2s, box-shadow 0.2s;
}

.problem__card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.problem__icon {
  width: 56px;
  height: 56px;
  background: var(--color-danger-bg);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--spacing-lg);
  color: var(--color-danger);
}

.problem__card-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  margin: 0 0 var(--spacing-sm);
  font-style: italic;
}

.problem__card-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.5;
}

@media (max-width: 968px) {
  .problem__grid {
    grid-template-columns: 1fr;
    max-width: 400px;
    margin: 0 auto;
  }
}

@media (min-width: 768px) {
  .problem__title {
    font-size: 2rem;
  }
}
</style>
