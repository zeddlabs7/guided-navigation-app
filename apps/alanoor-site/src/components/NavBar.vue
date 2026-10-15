<script setup lang="ts">
import { ref } from 'vue';

const isMenuOpen = ref(false);
</script>

<template>
  <nav class="nav">
    <div class="container nav__inner">
      <a href="/" class="nav__logo">
        <img src="/logo.png" alt="Alanoor Digital Solutions" class="nav__logo-img" />
      </a>

      <button class="nav__toggle" @click="isMenuOpen = !isMenuOpen" aria-label="Toggle menu">
        <svg v-if="!isMenuOpen" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 12h18M3 6h18M3 18h18" />
        </svg>
        <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      <div class="nav__links" :class="{ 'nav__links--open': isMenuOpen }">
        <a href="#about" @click="isMenuOpen = false">About</a>
        <a href="#products" @click="isMenuOpen = false">Products</a>
        <a href="#contact" @click="isMenuOpen = false">Contact</a>
        <a href="#contact" class="nav__cta" @click="isMenuOpen = false">Get In Touch</a>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--color-border-light);
}

.nav__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 72px;
}

.nav__logo {
  display: flex;
  align-items: center;
}

.nav__logo-img {
  height: 36px;
  width: auto;
  object-fit: contain;
}

.nav__toggle {
  display: none;
  background: none;
  border: none;
  padding: var(--spacing-sm);
  cursor: pointer;
  color: var(--color-text);
}

.nav__links {
  display: flex;
  align-items: center;
  gap: var(--spacing-xl);
}

.nav__links a {
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  transition: color 0.2s;
}

.nav__links a:hover {
  color: var(--color-primary);
}

.nav__cta {
  background: var(--color-button);
  color: white !important;
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--radius-md);
  transition: background-color 0.2s, transform 0.2s;
}

.nav__cta:hover {
  background: var(--color-button-hover) !important;
  color: white !important;
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .nav__toggle {
    display: block;
  }

  .nav__links {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--color-surface);
    flex-direction: column;
    padding: var(--spacing-lg);
    gap: var(--spacing-md);
    border-radius: 0 0 var(--radius-lg) var(--radius-lg);
    box-shadow: var(--shadow-lg);
    display: none;
  }

  .nav__links--open {
    display: flex;
  }

  .nav__cta {
    width: 100%;
    text-align: center;
  }
}
</style>
