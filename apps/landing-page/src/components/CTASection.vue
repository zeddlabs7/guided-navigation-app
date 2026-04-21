<script setup lang="ts">
</script>

<template>
  <section class="cta">
    <div class="landing-container">
      <div class="cta__card">
        <div class="cta__content">
          <h2 class="cta__title">Ready to Make Every Delivery a Success?</h2>
          <p class="cta__subtitle">
            Join thousands of users who have eliminated delivery confusion. Create your first visual guidance in under 2 minutes.
          </p>
          <div class="cta__actions">
            <a href="#" class="cta__btn cta__btn--primary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Get Started Free
            </a>
            <a href="#how-it-works" class="cta__btn cta__btn--secondary">
              Learn More
            </a>
          </div>
        </div>
        <div class="cta__decoration">
          <div class="cta__circle cta__circle--1"></div>
          <div class="cta__circle cta__circle--2"></div>
          <div class="cta__icon">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.cta {
  background: var(--color-surface);
  padding: 5rem 0;
}

.cta__card {
  background: linear-gradient(135deg, var(--color-primary) 0%, #1249d6 100%);
  border-radius: var(--radius-xl);
  padding: var(--spacing-2xl);
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--spacing-2xl);
  align-items: center;
  position: relative;
  overflow: hidden;
}

.cta__content {
  position: relative;
  z-index: 2;
}

.cta__title {
  font-size: 2rem;
  font-weight: var(--font-weight-semibold);
  color: white;
  margin: 0 0 var(--spacing-md);
  line-height: 1.2;
}

.cta__subtitle {
  font-size: var(--font-size-lg);
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 var(--spacing-xl);
  line-height: 1.6;
  max-width: 500px;
}

.cta__actions {
  display: flex;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.cta__btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-xl);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  text-decoration: none;
  transition: all 0.2s;
}

.cta__btn--primary {
  background: white;
  color: var(--color-primary);
}

.cta__btn--primary:hover {
  background: var(--color-background);
  transform: translateY(-2px);
  text-decoration: none;
}

.cta__btn--secondary {
  background: rgba(255, 255, 255, 0.15);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.cta__btn--secondary:hover {
  background: rgba(255, 255, 255, 0.25);
  text-decoration: none;
}

.cta__decoration {
  position: relative;
  width: 200px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cta__circle {
  position: absolute;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.cta__circle--1 {
  width: 100%;
  height: 100%;
  animation: pulse-ring 3s infinite;
}

.cta__circle--2 {
  width: 70%;
  height: 70%;
  animation: pulse-ring 3s infinite 1s;
}

.cta__icon {
  position: relative;
  z-index: 2;
  animation: float 4s ease-in-out infinite;
}

@keyframes pulse-ring {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  100% {
    transform: scale(1.2);
    opacity: 0;
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@media (max-width: 768px) {
  .cta__card {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .cta__subtitle {
    max-width: 100%;
  }

  .cta__actions {
    justify-content: center;
  }

  .cta__decoration {
    display: none;
  }

  .cta__title {
    font-size: 1.5rem;
  }

  .cta__btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
