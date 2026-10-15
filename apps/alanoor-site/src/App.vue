<script setup lang="ts">
import NavBar from './components/NavBar.vue';
import HeroSection from './components/HeroSection.vue';
import AboutSection from './components/AboutSection.vue';
import ProductsSection from './components/ProductsSection.vue';
import ContactSection from './components/ContactSection.vue';
import FooterSection from './components/FooterSection.vue';
</script>

<template>
  <div class="alanoor-site">
    <NavBar />
    <HeroSection />
    <AboutSection />
    <ProductsSection />
    <ContactSection />
    <FooterSection />
  </div>
</template>

<style scoped>
.alanoor-site {
  min-height: 100vh;
  background-color: var(--color-surface);
}
</style>
