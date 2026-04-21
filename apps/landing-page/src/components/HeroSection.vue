<script setup lang="ts">
import { ref } from 'vue';

const isMenuOpen = ref(false);
</script>

<template>
  <header class="hero">
    <nav class="hero__nav landing-container">
      <div class="hero__logo">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="14" fill="var(--color-primary)" />
          <path d="M16 8L22 20H10L16 8Z" fill="white" />
          <circle cx="16" cy="22" r="2" fill="white" />
        </svg>
        <span class="hero__brand">Arriveo</span>
      </div>
      
      <button class="hero__menu-toggle" @click="isMenuOpen = !isMenuOpen" aria-label="Toggle menu">
        <svg v-if="!isMenuOpen" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 12h18M3 6h18M3 18h18" />
        </svg>
        <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      <div class="hero__nav-links" :class="{ 'hero__nav-links--open': isMenuOpen }">
        <a href="#how-it-works" @click="isMenuOpen = false">How It Works</a>
        <a href="#features" @click="isMenuOpen = false">Features</a>
        <a href="#recipients" @click="isMenuOpen = false">For Recipients</a>
        <a href="#couriers" @click="isMenuOpen = false">For Couriers</a>
        <a href="#" class="hero__nav-cta">Get Started</a>
      </div>
    </nav>

    <div class="hero__content landing-container">
      <div class="hero__text">
        <h1 class="hero__title">
          Delivery Guidance<br />
          <span class="hero__title-accent">Made Visual</span>
        </h1>
        <p class="hero__subtitle">
          Help couriers find your exact location with photo-based step-by-step instructions. No more missed deliveries or confusing directions.
        </p>
        <div class="hero__actions">
          <a href="#" class="hero__btn hero__btn--primary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Create Guidance
          </a>
          <a href="#how-it-works" class="hero__btn hero__btn--secondary">
            See How It Works
          </a>
        </div>
      </div>
      
      <div class="hero__visual">
        <div class="hero__phone">
          <div class="hero__phone-screen">
            <div class="hero__phone-header">
              <span class="hero__phone-step">Step 2 of 4</span>
            </div>
            <div class="hero__phone-image">
              <div class="hero__phone-placeholder">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" stroke-width="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
              </div>
              <div class="hero__phone-arrow">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                  <path d="M12 4L12 20M12 20L6 14M12 20L18 14" stroke="var(--color-primary)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </div>
              <div class="hero__phone-marker">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--color-danger)">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
              </div>
            </div>
            <div class="hero__phone-caption">
              <strong>Turn right at the blue gate</strong>
              <span>Look for the numbered parking spots</span>
            </div>
          </div>
        </div>
        <div class="hero__decoration hero__decoration--1"></div>
        <div class="hero__decoration hero__decoration--2"></div>
      </div>
    </div>

    <div class="hero__scroll-indicator">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 5v14M5 12l7 7 7-7" />
      </svg>
    </div>
  </header>
</template>

<style scoped>
.hero {
  min-height: 100vh;
  background: linear-gradient(180deg, var(--color-primary-light) 0%, var(--color-surface) 100%);
  position: relative;
  display: flex;
  flex-direction: column;
}

.hero__nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: var(--spacing-lg);
  padding-bottom: var(--spacing-lg);
  position: relative;
  z-index: 100;
}

.hero__logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.hero__brand {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
}

.hero__menu-toggle {
  display: none;
  background: none;
  border: none;
  padding: var(--spacing-sm);
  cursor: pointer;
  color: var(--color-text);
}

.hero__nav-links {
  display: flex;
  align-items: center;
  gap: var(--spacing-xl);
}

.hero__nav-links a {
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  transition: color 0.2s;
}

.hero__nav-links a:hover {
  color: var(--color-primary);
  text-decoration: none;
}

.hero__nav-cta {
  background: var(--color-primary);
  color: white !important;
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--radius-md);
  transition: background-color 0.2s, transform 0.2s;
}

.hero__nav-cta:hover {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
}

.hero__content {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-2xl);
  align-items: center;
  padding-top: var(--spacing-2xl);
  padding-bottom: var(--spacing-2xl);
}

.hero__text {
  max-width: 540px;
}

.hero__title {
  font-size: 3.5rem;
  font-weight: var(--font-weight-semibold);
  line-height: 1.1;
  color: var(--color-text);
  margin: 0 0 var(--spacing-lg);
}

.hero__title-accent {
  color: var(--color-primary);
}

.hero__subtitle {
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin: 0 0 var(--spacing-xl);
}

.hero__actions {
  display: flex;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.hero__btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-xl);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  transition: all 0.2s;
  text-decoration: none;
}

.hero__btn--primary {
  background: var(--color-primary);
  color: white;
  box-shadow: var(--shadow-button);
}

.hero__btn--primary:hover {
  background: var(--color-primary-dark);
  transform: translateY(-2px);
  text-decoration: none;
}

.hero__btn--secondary {
  background: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.hero__btn--secondary:hover {
  background: var(--color-background);
  border-color: var(--color-primary);
  color: var(--color-primary);
  text-decoration: none;
}

.hero__visual {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.hero__phone {
  width: 280px;
  height: 560px;
  background: var(--color-text);
  border-radius: 40px;
  padding: 12px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  position: relative;
  z-index: 10;
}

.hero__phone-screen {
  width: 100%;
  height: 100%;
  background: var(--color-surface);
  border-radius: 32px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.hero__phone-header {
  padding: var(--spacing-lg) var(--spacing-md);
  background: var(--color-primary);
  color: white;
  text-align: center;
}

.hero__phone-step {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.hero__phone-image {
  flex: 1;
  background: var(--color-background);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero__phone-placeholder {
  opacity: 0.5;
}

.hero__phone-arrow {
  position: absolute;
  top: 30%;
  left: 50%;
  transform: translateX(-50%) rotate(-45deg);
  animation: bounce 2s infinite;
}

.hero__phone-marker {
  position: absolute;
  bottom: 25%;
  right: 25%;
  animation: pulse 2s infinite;
}

.hero__phone-caption {
  padding: var(--spacing-md);
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.hero__phone-caption strong {
  font-size: var(--font-size-sm);
  color: var(--color-text);
}

.hero__phone-caption span {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.hero__decoration {
  position: absolute;
  border-radius: 50%;
  z-index: 1;
}

.hero__decoration--1 {
  width: 300px;
  height: 300px;
  background: var(--color-primary);
  opacity: 0.1;
  top: -50px;
  right: -100px;
}

.hero__decoration--2 {
  width: 200px;
  height: 200px;
  background: var(--color-success);
  opacity: 0.1;
  bottom: -50px;
  left: 0;
}

.hero__scroll-indicator {
  position: absolute;
  bottom: var(--spacing-xl);
  left: 50%;
  transform: translateX(-50%);
  color: var(--color-text-muted);
  animation: float 3s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateX(-50%) rotate(-45deg) translateY(0); }
  50% { transform: translateX(-50%) rotate(-45deg) translateY(-10px); }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

@keyframes float {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(10px); }
}

@media (max-width: 968px) {
  .hero__content {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .hero__text {
    max-width: 100%;
  }

  .hero__title {
    font-size: 2.5rem;
  }

  .hero__actions {
    justify-content: center;
  }

  .hero__visual {
    order: -1;
  }

  .hero__phone {
    width: 220px;
    height: 440px;
  }
}

@media (max-width: 768px) {
  .hero__menu-toggle {
    display: block;
  }

  .hero__nav-links {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--color-surface);
    flex-direction: column;
    padding: var(--spacing-lg);
    gap: var(--spacing-md);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-md);
    display: none;
  }

  .hero__nav-links--open {
    display: flex;
  }

  .hero__nav-cta {
    width: 100%;
    text-align: center;
  }

  .hero__title {
    font-size: 2rem;
  }

  .hero__btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
