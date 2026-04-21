<script setup lang="ts">
const steps = [
  {
    number: '01',
    title: 'Capture Your Route',
    description: 'Take photos of the path from the main entrance to your exact drop-off spot. Mark key landmarks along the way.',
    icon: 'camera'
  },
  {
    number: '02',
    title: 'Add Visual Guides',
    description: 'Draw arrows, add markers, and write helpful notes on each photo to make directions crystal clear.',
    icon: 'edit'
  },
  {
    number: '03',
    title: 'Share Your Link',
    description: 'Generate a unique link and share it with your courier. They follow your visual guide step-by-step.',
    icon: 'share'
  }
];
</script>

<template>
  <section id="how-it-works" class="how-it-works">
    <div class="landing-container">
      <div class="how-it-works__header">
        <span class="how-it-works__label">How It Works</span>
        <h2 class="how-it-works__title">Simple Visual Guidance in 3 Steps</h2>
        <p class="how-it-works__subtitle">
          Create once, use forever. Your delivery instructions stay ready for every future delivery.
        </p>
      </div>

      <div class="how-it-works__steps">
        <div v-for="(step, index) in steps" :key="step.number" class="how-it-works__step">
          <div class="how-it-works__step-visual">
            <div class="how-it-works__step-number">{{ step.number }}</div>
            <div class="how-it-works__step-icon">
              <svg v-if="step.icon === 'camera'" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <svg v-else-if="step.icon === 'edit'" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              <svg v-else width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </div>
            <div v-if="index < steps.length - 1" class="how-it-works__connector"></div>
          </div>
          <div class="how-it-works__step-content">
            <h3 class="how-it-works__step-title">{{ step.title }}</h3>
            <p class="how-it-works__step-desc">{{ step.description }}</p>
          </div>
        </div>
      </div>

      <div class="how-it-works__demo">
        <div class="how-it-works__demo-card">
          <div class="how-it-works__demo-header">
            <span class="how-it-works__demo-badge">Live Demo</span>
            <h3 class="how-it-works__demo-title">See Arriveo in Action</h3>
          </div>
          <div class="how-it-works__demo-preview">
            <div class="how-it-works__demo-phones">
              <div class="how-it-works__demo-phone how-it-works__demo-phone--left">
                <div class="how-it-works__demo-screen">
                  <div class="how-it-works__demo-app-header">Recipient App</div>
                  <div class="how-it-works__demo-content">
                    <div class="how-it-works__demo-step-list">
                      <div class="how-it-works__demo-step-item">
                        <span class="how-it-works__demo-step-num">1</span>
                        <span>Main entrance</span>
                      </div>
                      <div class="how-it-works__demo-step-item how-it-works__demo-step-item--active">
                        <span class="how-it-works__demo-step-num">2</span>
                        <span>Turn at blue gate</span>
                      </div>
                      <div class="how-it-works__demo-step-item">
                        <span class="how-it-works__demo-step-num">3</span>
                        <span>Building B</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="how-it-works__demo-arrow">
                <svg width="40" height="24" viewBox="0 0 40 24" fill="none">
                  <path d="M0 12h36M28 4l8 8-8 8" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </div>
              <div class="how-it-works__demo-phone how-it-works__demo-phone--right">
                <div class="how-it-works__demo-screen">
                  <div class="how-it-works__demo-app-header how-it-works__demo-app-header--courier">Courier View</div>
                  <div class="how-it-works__demo-content">
                    <div class="how-it-works__demo-image">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" stroke-width="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                    </div>
                    <div class="how-it-works__demo-nav">
                      <button class="how-it-works__demo-nav-btn">Previous</button>
                      <span>2 of 3</span>
                      <button class="how-it-works__demo-nav-btn how-it-works__demo-nav-btn--primary">Next</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.how-it-works {
  background: var(--color-surface);
  padding: 5rem 0;
}

.how-it-works__header {
  text-align: center;
  max-width: 640px;
  margin: 0 auto var(--spacing-2xl);
}

.how-it-works__label {
  display: inline-block;
  background: var(--color-primary-bg);
  color: var(--color-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-full);
  margin-bottom: var(--spacing-md);
}

.how-it-works__title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  margin: 0 0 var(--spacing-md);
}

.how-it-works__subtitle {
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.6;
}

.how-it-works__steps {
  display: flex;
  justify-content: space-between;
  gap: var(--spacing-xl);
  margin-bottom: var(--spacing-2xl);
}

.how-it-works__step {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  position: relative;
}

.how-it-works__step-visual {
  position: relative;
  margin-bottom: var(--spacing-lg);
}

.how-it-works__step-number {
  position: absolute;
  top: -8px;
  left: -8px;
  background: var(--color-primary);
  color: white;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.how-it-works__step-icon {
  width: 80px;
  height: 80px;
  background: var(--color-primary-bg);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
}

.how-it-works__connector {
  position: absolute;
  top: 50%;
  left: calc(100% + 10px);
  width: calc(100% - 20px);
  height: 2px;
  background: linear-gradient(90deg, var(--color-primary) 0%, var(--color-border) 100%);
  transform: translateY(-50%);
}

.how-it-works__step-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  margin: 0 0 var(--spacing-sm);
}

.how-it-works__step-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.5;
  max-width: 280px;
}

.how-it-works__demo {
  margin-top: var(--spacing-2xl);
}

.how-it-works__demo-card {
  background: linear-gradient(135deg, var(--color-primary) 0%, #1249d6 100%);
  border-radius: var(--radius-xl);
  padding: var(--spacing-2xl);
  overflow: hidden;
}

.how-it-works__demo-header {
  text-align: center;
  margin-bottom: var(--spacing-xl);
}

.how-it-works__demo-badge {
  display: inline-block;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-full);
  margin-bottom: var(--spacing-sm);
}

.how-it-works__demo-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: white;
  margin: 0;
}

.how-it-works__demo-preview {
  display: flex;
  justify-content: center;
}

.how-it-works__demo-phones {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.how-it-works__demo-phone {
  width: 180px;
  height: 320px;
  background: #1a1a1a;
  border-radius: 24px;
  padding: 8px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
}

.how-it-works__demo-screen {
  width: 100%;
  height: 100%;
  background: var(--color-surface);
  border-radius: 18px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.how-it-works__demo-app-header {
  background: var(--color-primary);
  color: white;
  padding: var(--spacing-sm);
  text-align: center;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
}

.how-it-works__demo-app-header--courier {
  background: var(--color-success);
}

.how-it-works__demo-content {
  flex: 1;
  padding: var(--spacing-sm);
  display: flex;
  flex-direction: column;
}

.how-it-works__demo-step-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.how-it-works__demo-step-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-2xs);
  color: var(--color-text-secondary);
}

.how-it-works__demo-step-item--active {
  background: var(--color-primary-bg);
  color: var(--color-primary);
}

.how-it-works__demo-step-num {
  width: 18px;
  height: 18px;
  background: var(--color-border);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: var(--font-weight-semibold);
}

.how-it-works__demo-step-item--active .how-it-works__demo-step-num {
  background: var(--color-primary);
  color: white;
}

.how-it-works__demo-image {
  flex: 1;
  background: var(--color-background);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
}

.how-it-works__demo-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: var(--spacing-sm);
  font-size: var(--font-size-2xs);
  color: var(--color-text-muted);
}

.how-it-works__demo-nav-btn {
  background: var(--color-background);
  border: none;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-2xs);
  cursor: pointer;
}

.how-it-works__demo-nav-btn--primary {
  background: var(--color-primary);
  color: white;
}

.how-it-works__demo-arrow {
  flex-shrink: 0;
}

@media (max-width: 968px) {
  .how-it-works__steps {
    flex-direction: column;
    align-items: center;
  }

  .how-it-works__connector {
    display: none;
  }

  .how-it-works__demo-phones {
    flex-direction: column;
  }

  .how-it-works__demo-arrow {
    transform: rotate(90deg);
  }
}

@media (min-width: 768px) {
  .how-it-works__title {
    font-size: 2rem;
  }
}
</style>
