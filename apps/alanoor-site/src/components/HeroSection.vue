<script setup lang="ts">
</script>

<template>
  <header class="hero">
    <div class="container hero__content">
      <div class="hero__text">
        <span class="hero__badge">Technology &middot; Development &middot; Innovation</span>
        <h1 class="hero__title">
          We Build Technology<br />
          <span class="hero__title-accent">That Solves Real Problems</span>
        </h1>
        <p class="hero__subtitle">
          Alanoor is a technology development company that designs and builds digital products 
          across multiple sectors — from logistics to e-commerce and beyond.
        </p>
        <div class="hero__actions">
          <a href="#products" class="hero__btn hero__btn--primary">
            Explore Our Products
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
          <a href="#about" class="hero__btn hero__btn--secondary">
            Learn More
          </a>
        </div>
      </div>

      <div class="hero__visual">
        <div class="hero__graphic">
          <div class="hero__node hero__node--1">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8M12 17v4" />
            </svg>
          </div>
          <div class="hero__node hero__node--2">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <div class="hero__node hero__node--3">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2">
              <rect x="5" y="2" width="14" height="20" rx="2" />
              <path d="M12 18h.01" />
            </svg>
          </div>
          <div class="hero__node hero__node--center">
            <img src="/logo.png" alt="Alanoor Digital Solutions" class="hero__center-logo" />
          </div>
          <svg class="hero__connections" viewBox="0 0 300 300" fill="none">
            <line x1="150" y1="150" x2="60" y2="60" stroke="var(--color-primary)" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.3" />
            <line x1="150" y1="150" x2="240" y2="80" stroke="var(--color-primary)" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.3" />
            <line x1="150" y1="150" x2="70" y2="240" stroke="var(--color-primary)" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.3" />
          </svg>
        </div>
        <div class="hero__decoration hero__decoration--1"></div>
        <div class="hero__decoration hero__decoration--2"></div>
      </div>
    </div>

    <div class="hero__scroll">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 5v14M5 12l7 7 7-7" />
      </svg>
    </div>
  </header>
</template>

<style scoped>
.hero {
  min-height: 100vh;
  background: var(--gradient-hero);
  position: relative;
  display: flex;
  flex-direction: column;
  padding-top: 72px;
}

.hero__content {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-2xl);
  align-items: center;
  padding-top: var(--spacing-3xl);
  padding-bottom: var(--spacing-2xl);
}

.hero__text {
  max-width: 560px;
}

.hero__badge {
  display: inline-block;
  background: var(--color-primary-bg);
  color: var(--color-primary-dark);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-full);
  margin-bottom: var(--spacing-lg);
  border: 1px solid var(--color-primary-light);
}

.hero__title {
  font-size: var(--font-size-5xl);
  font-weight: var(--font-weight-bold);
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
  line-height: 1.7;
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
  background: var(--color-button);
  color: white;
  box-shadow: var(--shadow-button);
}

.hero__btn--primary:hover {
  background: var(--color-button-hover);
  color: white;
  transform: translateY(-2px);
}

.hero__btn--secondary {
  background: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.hero__btn--secondary:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.hero__visual {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.hero__graphic {
  position: relative;
  width: 300px;
  height: 300px;
}

.hero__connections {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.hero__node {
  position: absolute;
  width: 64px;
  height: 64px;
  background: var(--color-surface);
  border: 2px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-md);
  z-index: 2;
}

.hero__node--1 {
  top: 0;
  left: 20px;
  animation: float-node 4s ease-in-out infinite;
}

.hero__node--2 {
  top: 20px;
  right: 0;
  animation: float-node 4s ease-in-out infinite 1s;
}

.hero__node--3 {
  bottom: 10px;
  left: 10px;
  animation: float-node 4s ease-in-out infinite 2s;
}

.hero__node--center {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 88px;
  height: 88px;
  background: var(--color-surface);
  border: 2px solid var(--color-primary-light);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
}

.hero__center-logo {
  height: 40px;
  width: auto;
}

.hero__decoration {
  position: absolute;
  border-radius: 50%;
  z-index: 0;
}

.hero__decoration--1 {
  width: 280px;
  height: 280px;
  background: var(--color-primary);
  opacity: 0.06;
  top: -30px;
  right: -60px;
}

.hero__decoration--2 {
  width: 180px;
  height: 180px;
  background: var(--color-primary-dark);
  opacity: 0.06;
  bottom: -20px;
  left: -20px;
}

.hero__scroll {
  position: absolute;
  bottom: var(--spacing-xl);
  left: 50%;
  transform: translateX(-50%);
  color: var(--color-text-muted);
  animation: float 3s ease-in-out infinite;
}

@keyframes float-node {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.hero__node--center {
  animation: none;
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
    font-size: var(--font-size-4xl);
  }

  .hero__actions {
    justify-content: center;
  }

  .hero__visual {
    order: -1;
    min-height: 280px;
  }

  .hero__graphic {
    width: 240px;
    height: 240px;
  }
}

@media (max-width: 768px) {
  .hero__title {
    font-size: var(--font-size-3xl);
  }

  .hero__btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
