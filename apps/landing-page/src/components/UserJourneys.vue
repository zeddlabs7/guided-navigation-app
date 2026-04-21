<script setup lang="ts">
const recipientFeatures = [
  'Create visual step-by-step guidance',
  'Add arrows, markers, and labels to photos',
  'Set your availability preferences',
  'Generate unique shareable links',
  'Update instructions anytime',
  'Track delivery feedback'
];

const courierFeatures = [
  'No app download required',
  'Follow photo-based directions',
  'Swipe through steps easily',
  'Open location in Maps app',
  'Works offline after loading',
  'Submit delivery feedback'
];
</script>

<template>
  <section id="recipients" class="journeys">
    <div class="landing-container">
      <div class="journeys__header">
        <span class="journeys__label">Two Apps, One Goal</span>
        <h2 class="journeys__title">Designed for Both Sides of Delivery</h2>
        <p class="journeys__subtitle">
          Whether you're receiving packages or delivering them, Arriveo makes the experience seamless.
        </p>
      </div>

      <div class="journeys__cards">
        <div class="journeys__card journeys__card--recipient">
          <div class="journeys__card-header">
            <div class="journeys__card-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div>
              <h3 class="journeys__card-title">For Recipients</h3>
              <p class="journeys__card-tagline">Create guidance once, use forever</p>
            </div>
          </div>

          <div class="journeys__card-visual">
            <div class="journeys__phone">
              <div class="journeys__screen">
                <div class="journeys__app-bar">
                  <span>My Guidance Sets</span>
                </div>
                <div class="journeys__content">
                  <div class="journeys__guidance-card">
                    <div class="journeys__guidance-thumb"></div>
                    <div class="journeys__guidance-info">
                      <strong>Home - Main Entrance</strong>
                      <span>4 steps • Updated today</span>
                    </div>
                  </div>
                  <div class="journeys__guidance-card">
                    <div class="journeys__guidance-thumb"></div>
                    <div class="journeys__guidance-info">
                      <strong>Office - Building B</strong>
                      <span>6 steps • Updated last week</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <ul class="journeys__features">
            <li v-for="feature in recipientFeatures" :key="feature">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {{ feature }}
            </li>
          </ul>

          <a href="#" class="journeys__btn journeys__btn--primary">
            Start Creating
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </a>
        </div>

        <div id="couriers" class="journeys__card journeys__card--courier">
          <div class="journeys__card-header">
            <div class="journeys__card-icon journeys__card-icon--courier">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="1" y="3" width="15" height="13" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
            </div>
            <div>
              <h3 class="journeys__card-title">For Couriers</h3>
              <p class="journeys__card-tagline">Find any location with ease</p>
            </div>
          </div>

          <div class="journeys__card-visual">
            <div class="journeys__phone">
              <div class="journeys__screen">
                <div class="journeys__app-bar journeys__app-bar--courier">
                  <span>Step 2 of 4</span>
                </div>
                <div class="journeys__content journeys__content--courier">
                  <div class="journeys__step-image">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" stroke-width="1">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="M21 15l-5-5L5 21" />
                    </svg>
                    <div class="journeys__overlay-arrow">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M12 4L12 20M12 20L6 14M12 20L18 14" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round" />
                      </svg>
                    </div>
                  </div>
                  <div class="journeys__step-caption">
                    <strong>Turn right at the blue gate</strong>
                  </div>
                  <div class="journeys__step-nav">
                    <button>Back</button>
                    <button class="journeys__step-nav-next">Next Step</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <ul class="journeys__features">
            <li v-for="feature in courierFeatures" :key="feature">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {{ feature }}
            </li>
          </ul>

          <a href="#" class="journeys__btn journeys__btn--secondary">
            View Demo
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.journeys {
  background: var(--color-surface);
  padding: 5rem 0;
}

.journeys__header {
  text-align: center;
  max-width: 640px;
  margin: 0 auto var(--spacing-2xl);
}

.journeys__label {
  display: inline-block;
  background: var(--color-step-elevator-bg);
  color: var(--color-step-elevator);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-full);
  margin-bottom: var(--spacing-md);
}

.journeys__title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  margin: 0 0 var(--spacing-md);
}

.journeys__subtitle {
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.6;
}

.journeys__cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-xl);
}

.journeys__card {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  display: flex;
  flex-direction: column;
}

.journeys__card-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
}

.journeys__card-icon {
  width: 56px;
  height: 56px;
  background: var(--color-primary-bg);
  color: var(--color-primary);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
}

.journeys__card-icon--courier {
  background: var(--color-success-bg);
  color: var(--color-success);
}

.journeys__card-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  margin: 0;
}

.journeys__card-tagline {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: var(--spacing-xs) 0 0;
}

.journeys__card-visual {
  display: flex;
  justify-content: center;
  margin-bottom: var(--spacing-xl);
}

.journeys__phone {
  width: 200px;
  height: 360px;
  background: #1a1a1a;
  border-radius: 28px;
  padding: 8px;
  box-shadow: var(--shadow-md);
}

.journeys__screen {
  width: 100%;
  height: 100%;
  background: var(--color-surface);
  border-radius: 22px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.journeys__app-bar {
  background: var(--color-primary);
  color: white;
  padding: var(--spacing-md);
  text-align: center;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.journeys__app-bar--courier {
  background: var(--color-success);
}

.journeys__content {
  flex: 1;
  padding: var(--spacing-sm);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.journeys__content--courier {
  gap: var(--spacing-xs);
}

.journeys__guidance-card {
  display: flex;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: var(--color-background);
  border-radius: var(--radius-md);
}

.journeys__guidance-thumb {
  width: 48px;
  height: 48px;
  background: var(--color-border);
  border-radius: var(--radius-sm);
}

.journeys__guidance-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
}

.journeys__guidance-info strong {
  font-size: var(--font-size-xs);
  color: var(--color-text);
}

.journeys__guidance-info span {
  font-size: var(--font-size-2xs);
  color: var(--color-text-muted);
}

.journeys__step-image {
  flex: 1;
  background: var(--color-background);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.journeys__overlay-arrow {
  position: absolute;
  animation: bounce 2s infinite;
}

.journeys__step-caption {
  padding: var(--spacing-xs);
  text-align: center;
}

.journeys__step-caption strong {
  font-size: var(--font-size-xs);
  color: var(--color-text);
}

.journeys__step-nav {
  display: flex;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs);
}

.journeys__step-nav button {
  flex: 1;
  padding: var(--spacing-xs);
  border: none;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-2xs);
  background: var(--color-background);
  cursor: pointer;
}

.journeys__step-nav-next {
  background: var(--color-success) !important;
  color: white !important;
}

.journeys__features {
  list-style: none;
  padding: 0;
  margin: 0 0 var(--spacing-xl);
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-sm);
}

.journeys__features li {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.journeys__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-xl);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  text-decoration: none;
  transition: all 0.2s;
  margin-top: auto;
}

.journeys__btn--primary {
  background: var(--color-primary);
  color: white;
}

.journeys__btn--primary:hover {
  background: var(--color-primary-dark);
  text-decoration: none;
}

.journeys__btn--secondary {
  background: var(--color-success);
  color: white;
}

.journeys__btn--secondary:hover {
  background: #006b2d;
  text-decoration: none;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

@media (max-width: 968px) {
  .journeys__cards {
    grid-template-columns: 1fr;
  }

  .journeys__features {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 768px) {
  .journeys__title {
    font-size: 2rem;
  }
}
</style>
