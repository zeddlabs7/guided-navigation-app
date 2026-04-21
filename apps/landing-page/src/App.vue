<script setup lang="ts">
import HeroSection from './components/HeroSection.vue';
import ProblemSection from './components/ProblemSection.vue';
import HowItWorks from './components/HowItWorks.vue';
import FeaturesGrid from './components/FeaturesGrid.vue';
import UserJourneys from './components/UserJourneys.vue';
import StatsSection from './components/StatsSection.vue';
import CTASection from './components/CTASection.vue';
import FooterSection from './components/FooterSection.vue';
</script>

<template>
  <div class="landing-page">
    <HeroSection />
    <ProblemSection />
    <HowItWorks />
    <FeaturesGrid />
    <UserJourneys />
    <StatsSection />
    <CTASection />
    <FooterSection />
  </div>
</template>

<style scoped>
.landing-page {
  min-height: 100vh;
  background-color: var(--color-surface);
}
</style>
