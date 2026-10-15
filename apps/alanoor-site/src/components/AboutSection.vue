<script setup lang="ts">
const values = [
  {
    icon: 'target',
    title: 'Mission-Driven',
    description: 'We identify real-world problems across industries and build technology that solves them — efficiently, elegantly, and at scale.'
  },
  {
    icon: 'lightbulb',
    title: 'Innovation First',
    description: 'We combine cutting-edge technology with intuitive design to create products that anyone can use, no training required.'
  },
  {
    icon: 'globe',
    title: 'Multi-Sector Expertise',
    description: 'From logistics and delivery to e-commerce and digital services — we build solutions that work across industries, regions, and languages.'
  }
];
</script>

<template>
  <section id="about" class="about">
    <div class="container">
      <div class="about__header">
        <span class="about__label">About Us</span>
        <h2 class="about__title">Technology That Powers Every Sector</h2>
        <p class="about__subtitle">
          Alanoor is a technology development company that builds digital products and platforms 
          across multiple sectors. We believe great technology should simplify complexity — turning 
          industry challenges into seamless digital experiences.
        </p>
      </div>

      <div class="about__grid">
        <div v-for="value in values" :key="value.title" class="about__card">
          <div class="about__icon">
            <svg v-if="value.icon === 'target'" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
            </svg>
            <svg v-else-if="value.icon === 'lightbulb'" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
            </svg>
            <svg v-else width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </div>
          <h3 class="about__card-title">{{ value.title }}</h3>
          <p class="about__card-desc">{{ value.description }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.about {
  background: var(--color-surface);
}

.about__header {
  text-align: center;
  max-width: 680px;
  margin: 0 auto var(--spacing-3xl);
}

.about__label {
  display: inline-block;
  background: var(--color-primary-bg);
  color: var(--color-primary-dark);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-full);
  margin-bottom: var(--spacing-md);
  border: 1px solid var(--color-primary-light);
}

.about__title {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text);
  margin: 0 0 var(--spacing-md);
  line-height: 1.2;
}

.about__subtitle {
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.7;
}

.about__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-xl);
}

.about__card {
  background: var(--color-background);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  text-align: center;
  transition: transform 0.2s, box-shadow 0.2s;
}

.about__card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.about__icon {
  width: 64px;
  height: 64px;
  background: var(--color-primary-light);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--spacing-lg);
  color: var(--color-primary-dark);
}

.about__card-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  margin: 0 0 var(--spacing-sm);
}

.about__card-desc {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.6;
}

@media (max-width: 968px) {
  .about__grid {
    grid-template-columns: 1fr;
    max-width: 480px;
    margin: 0 auto;
  }
}

@media (min-width: 768px) {
  .about__title {
    font-size: var(--font-size-4xl);
  }
}
</style>
