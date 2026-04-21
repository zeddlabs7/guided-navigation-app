<script setup lang="ts">
const stats = [
  { value: '98%', label: 'Delivery Success Rate', description: 'With visual guidance' },
  { value: '75%', label: 'Fewer Phone Calls', description: 'Less time explaining directions' },
  { value: '<2min', label: 'Setup Time', description: 'To create your first guidance' },
  { value: '100%', label: 'Free to Use', description: 'No hidden costs or subscriptions' }
];

const testimonials = [
  {
    quote: "Finally, my packages reach my door without endless phone calls. The visual steps make it so easy for couriers.",
    author: "Sarah M.",
    role: "Recipient",
    avatar: "S"
  },
  {
    quote: "As a delivery driver, these photo guides save me so much time in apartment complexes. Game changer!",
    author: "Ahmed K.",
    role: "Courier",
    avatar: "A"
  },
  {
    quote: "I created one guidance set for my office and haven't had a failed delivery since. Brilliant concept.",
    author: "Michael T.",
    role: "Recipient",
    avatar: "M"
  }
];
</script>

<template>
  <section class="stats">
    <div class="landing-container">
      <div class="stats__numbers">
        <div v-for="stat in stats" :key="stat.label" class="stats__item">
          <div class="stats__value">{{ stat.value }}</div>
          <div class="stats__label">{{ stat.label }}</div>
          <div class="stats__desc">{{ stat.description }}</div>
        </div>
      </div>

      <div class="stats__testimonials">
        <div class="stats__testimonials-header">
          <span class="stats__label-badge">Testimonials</span>
          <h2 class="stats__title">What Our Users Say</h2>
        </div>

        <div class="stats__testimonials-grid">
          <div v-for="testimonial in testimonials" :key="testimonial.author" class="stats__testimonial">
            <div class="stats__quote">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--color-primary-light)">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>
            </div>
            <p class="stats__testimonial-text">{{ testimonial.quote }}</p>
            <div class="stats__testimonial-author">
              <div class="stats__avatar">{{ testimonial.avatar }}</div>
              <div>
                <div class="stats__author-name">{{ testimonial.author }}</div>
                <div class="stats__author-role">{{ testimonial.role }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.stats {
  background: var(--color-background);
  padding: 5rem 0;
}

.stats__numbers {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-lg);
  margin-bottom: 5rem;
}

.stats__item {
  text-align: center;
  padding: var(--spacing-xl);
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
}

.stats__value {
  font-size: 3rem;
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  line-height: 1;
  margin-bottom: var(--spacing-sm);
}

.stats__label {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
  margin-bottom: var(--spacing-xs);
}

.stats__desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.stats__testimonials-header {
  text-align: center;
  margin-bottom: var(--spacing-2xl);
}

.stats__label-badge {
  display: inline-block;
  background: var(--color-success-bg);
  color: var(--color-success);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-full);
  margin-bottom: var(--spacing-md);
}

.stats__title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  margin: 0;
}

.stats__testimonials-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-lg);
}

.stats__testimonial {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  display: flex;
  flex-direction: column;
}

.stats__quote {
  margin-bottom: var(--spacing-md);
}

.stats__testimonial-text {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin: 0 0 var(--spacing-lg);
  flex: 1;
}

.stats__testimonial-author {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.stats__avatar {
  width: 40px;
  height: 40px;
  background: var(--color-primary);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
}

.stats__author-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
}

.stats__author-role {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

@media (max-width: 968px) {
  .stats__numbers {
    grid-template-columns: repeat(2, 1fr);
  }

  .stats__testimonials-grid {
    grid-template-columns: 1fr;
    max-width: 500px;
    margin: 0 auto;
  }
}

@media (max-width: 640px) {
  .stats__numbers {
    grid-template-columns: 1fr;
  }

  .stats__value {
    font-size: 2.5rem;
  }
}

@media (min-width: 768px) {
  .stats__title {
    font-size: 2rem;
  }
}
</style>
