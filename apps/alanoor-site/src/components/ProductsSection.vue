<script setup lang="ts">
const products = [
  {
    name: 'Yadul',
    tagline: 'Delivery Guidance Made Visual',
    description: 'Photo-based step-by-step instructions that guide couriers to the exact drop-off location. No more missed deliveries, no more confusing directions.',
    features: [
      'Visual guidance with photos & annotations',
      'One-tap shareable links for couriers',
      'Works on any device — no app needed for couriers',
      'Availability scheduling & smart notifications'
    ],
    link: 'https://yadul.app',
    status: 'live',
    color: 'violet'
  },
  {
    name: 'More Products',
    tagline: 'Expanding Across Sectors',
    description: 'We are actively developing solutions across e-commerce, healthcare, education, and more. Our team is always exploring new sectors where technology can make a real impact.',
    features: [
      'E-commerce & marketplace platforms',
      'Healthcare & patient management tools',
      'Education & learning solutions',
      'Custom enterprise software'
    ],
    link: '#contact',
    status: 'upcoming',
    color: 'teal'
  }
];
</script>

<template>
  <section id="products" class="products">
    <div class="container">
      <div class="products__header">
        <span class="products__label">Our Products</span>
        <h2 class="products__title">Products Across Sectors</h2>
        <p class="products__subtitle">
          We build and launch digital products that tackle real challenges — from logistics to e-commerce, healthcare, and beyond.
        </p>
      </div>

      <div class="products__grid">
        <div 
          v-for="product in products" 
          :key="product.name" 
          class="products__card"
          :class="{ 'products__card--upcoming': product.status === 'upcoming' }"
        >
          <div class="products__card-header">
            <div class="products__card-badge" :class="`products__card-badge--${product.status}`">
              {{ product.status === 'live' ? 'Live' : 'Coming Soon' }}
            </div>
            <h3 class="products__card-name">{{ product.name }}</h3>
            <p class="products__card-tagline">{{ product.tagline }}</p>
          </div>

          <p class="products__card-desc">{{ product.description }}</p>

          <ul class="products__features">
            <li v-for="feature in product.features" :key="feature">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {{ feature }}
            </li>
          </ul>

          <a 
            :href="product.link" 
            class="products__card-link"
            :class="{ 'products__card-link--primary': product.status === 'live' }"
            :target="product.status === 'live' ? '_blank' : undefined"
          >
            {{ product.status === 'live' ? 'Visit Product' : 'Get Notified' }}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.products {
  background: var(--color-background);
}

.products__header {
  text-align: center;
  max-width: 640px;
  margin: 0 auto var(--spacing-3xl);
}

.products__label {
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

.products__title {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text);
  margin: 0 0 var(--spacing-md);
  line-height: 1.2;
}

.products__subtitle {
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.6;
}

.products__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-xl);
  max-width: 900px;
  margin: 0 auto;
}

.products__card {
  background: var(--color-surface);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  display: flex;
  flex-direction: column;
  transition: transform 0.2s, box-shadow 0.2s;
}

.products__card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.products__card--upcoming {
  border-style: dashed;
  opacity: 0.85;
}

.products__card-header {
  margin-bottom: var(--spacing-lg);
}

.products__card-badge {
  display: inline-block;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  padding: 2px var(--spacing-sm);
  border-radius: var(--radius-full);
  margin-bottom: var(--spacing-sm);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.products__card-badge--live {
  background: var(--color-success-bg);
  color: var(--color-success);
}

.products__card-badge--upcoming {
  background: var(--color-primary-light);
  color: var(--color-primary-dark);
}

.products__card-name {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text);
  margin: 0 0 var(--spacing-xs);
}

.products__card-tagline {
  font-size: var(--font-size-base);
  color: var(--color-primary);
  font-weight: var(--font-weight-medium);
  margin: 0;
}

.products__card-desc {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin: 0 0 var(--spacing-lg);
}

.products__features {
  list-style: none;
  padding: 0;
  margin: 0 0 var(--spacing-xl);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  flex: 1;
}

.products__features li {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.products__features li svg {
  color: var(--color-success);
  flex-shrink: 0;
}

.products__card-link {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  padding: var(--spacing-md) var(--spacing-xl);
  border-radius: var(--radius-md);
  transition: all 0.2s;
  text-align: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
}

.products__card-link:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.products__card-link--primary {
  background: var(--color-button);
  color: white;
  border-color: var(--color-button);
}

.products__card-link--primary:hover {
  background: var(--color-button-hover);
  border-color: var(--color-button-hover);
  color: white;
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .products__grid {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 768px) {
  .products__title {
    font-size: var(--font-size-4xl);
  }
}
</style>
