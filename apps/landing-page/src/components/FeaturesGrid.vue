<script setup lang="ts">
const features = [
  {
    icon: 'camera',
    title: 'Photo-Based Steps',
    description: 'Capture real photos of your route. Visual guidance beats text directions every time.',
    color: 'primary'
  },
  {
    icon: 'arrow',
    title: 'Visual Overlays',
    description: 'Draw arrows, drop markers, and add labels directly on your photos for crystal-clear directions.',
    color: 'warning'
  },
  {
    icon: 'calendar',
    title: 'Availability Settings',
    description: 'Set your delivery preferences - days, times, and special instructions all in one place.',
    color: 'success'
  },
  {
    icon: 'link',
    title: 'Shareable Links',
    description: 'Generate unique links for each delivery service. No app download required for couriers.',
    color: 'info'
  },
  {
    icon: 'play',
    title: 'Step-by-Step Playback',
    description: 'Couriers navigate through your photos one step at a time, never missing a turn.',
    color: 'elevator'
  },
  {
    icon: 'map',
    title: 'Maps Integration',
    description: 'Deep links to Google Maps and Apple Maps for the final approach to your location.',
    color: 'danger'
  }
];

const colorMap: Record<string, string> = {
  primary: 'var(--color-primary)',
  warning: 'var(--color-warning)',
  success: 'var(--color-success)',
  info: 'var(--color-info)',
  elevator: 'var(--color-step-elevator)',
  danger: 'var(--color-danger)'
};

const bgColorMap: Record<string, string> = {
  primary: 'var(--color-primary-bg)',
  warning: 'var(--color-warning-bg)',
  success: 'var(--color-success-bg)',
  info: 'var(--color-info-bg)',
  elevator: 'var(--color-step-elevator-bg)',
  danger: 'var(--color-danger-bg)'
};
</script>

<template>
  <section id="features" class="features">
    <div class="landing-container">
      <div class="features__header">
        <span class="features__label">Features</span>
        <h2 class="features__title">Everything You Need for Perfect Deliveries</h2>
        <p class="features__subtitle">
          A complete toolkit designed to make every delivery successful, from first-time couriers to regulars.
        </p>
      </div>

      <div class="features__grid">
        <div v-for="feature in features" :key="feature.title" class="features__card">
          <div 
            class="features__icon" 
            :style="{ 
              backgroundColor: bgColorMap[feature.color], 
              color: colorMap[feature.color] 
            }"
          >
            <svg v-if="feature.icon === 'camera'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            <svg v-else-if="feature.icon === 'arrow'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
            <svg v-else-if="feature.icon === 'calendar'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <svg v-else-if="feature.icon === 'link'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <svg v-else-if="feature.icon === 'play'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
              <line x1="8" y1="2" x2="8" y2="18" />
              <line x1="16" y1="6" x2="16" y2="22" />
            </svg>
          </div>
          <h3 class="features__card-title">{{ feature.title }}</h3>
          <p class="features__card-desc">{{ feature.description }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.features {
  background: var(--color-background);
  padding: 5rem 0;
}

.features__header {
  text-align: center;
  max-width: 640px;
  margin: 0 auto var(--spacing-2xl);
}

.features__label {
  display: inline-block;
  background: var(--color-primary-bg);
  color: var(--color-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-full);
  margin-bottom: var(--spacing-md);
}

.features__title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  margin: 0 0 var(--spacing-md);
}

.features__subtitle {
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.6;
}

.features__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-lg);
}

.features__card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  transition: transform 0.2s, box-shadow 0.2s;
}

.features__card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.features__icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--spacing-md);
}

.features__card-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  margin: 0 0 var(--spacing-sm);
}

.features__card-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.5;
}

@media (max-width: 968px) {
  .features__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .features__grid {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 768px) {
  .features__title {
    font-size: 2rem;
  }
}
</style>
