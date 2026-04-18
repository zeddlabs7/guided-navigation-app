<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { GButton, GCard, GBadge, GSpinner } from '@guidenav/ui';
import {
  getGuidanceSet,
  createShareLink,
  getShareLinkForGuidance,
  revokeShareLink,
} from '@guidenav/services';

const router = useRouter();
const route = useRoute();
const guidanceSetId = route.params.guidanceSetId as string;

const guidanceTitle = ref('');
const shareToken = ref<string | null>(null);
const shareLinkId = ref<string | null>(null);
const linkStatus = ref<'ACTIVE' | 'EXPIRED' | 'REVOKED' | null>(null);
const copied = ref(false);
const loading = ref(true);
const generating = ref(false);
const revoking = ref(false);

const courierAppUrl = computed(() => {
  if (!shareToken.value) return null;
  
  // In production, this would be the courier app domain
  // For local development, use port 3001
  const baseUrl = import.meta.env.VITE_COURIER_APP_URL || 'http://localhost:3001';
  return `${baseUrl}/g/${shareToken.value}`;
});

onMounted(async () => {
  try {
    const guidanceSet = await getGuidanceSet(guidanceSetId);
    if (guidanceSet) {
      guidanceTitle.value = guidanceSet.title;
      
      // Check for existing active share link
      if (guidanceSet.status === 'PUBLISHED') {
        const existingLink = await getShareLinkForGuidance(guidanceSetId);
        if (existingLink && existingLink.status === 'ACTIVE') {
          shareLinkId.value = existingLink.id;
          linkStatus.value = 'ACTIVE';
          // Note: We can't retrieve the original token from the hash
          // User needs to regenerate if they lost the link
        }
      }
    }
  } catch (err) {
    console.error('Failed to load guidance set:', err);
  } finally {
    loading.value = false;
  }
});

function handleBack() {
  router.push(`/guidance/${guidanceSetId}/edit`);
}

function handleGoToDashboard() {
  router.push('/dashboard');
}

async function handleGenerateLink() {
  generating.value = true;
  try {
    // If there's an existing link, revoke it first
    if (shareLinkId.value) {
      await revokeShareLink(shareLinkId.value);
    }
    
    // Create new share link
    const result = await createShareLink({
      guidanceSetId,
      expiryDurationMinutes: 1440, // 24 hours
    });
    
    shareToken.value = result.token;
    shareLinkId.value = result.shareLinkId;
    linkStatus.value = 'ACTIVE';
  } catch (err) {
    console.error('Failed to generate share link:', err);
  } finally {
    generating.value = false;
  }
}

async function handleCopyLink() {
  if (courierAppUrl.value) {
    await navigator.clipboard.writeText(courierAppUrl.value);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  }
}

async function handleRevokeLink() {
  if (!shareLinkId.value) return;
  
  revoking.value = true;
  try {
    await revokeShareLink(shareLinkId.value);
    shareToken.value = null;
    shareLinkId.value = null;
    linkStatus.value = null;
  } catch (err) {
    console.error('Failed to revoke share link:', err);
  } finally {
    revoking.value = false;
  }
}
</script>

<template>
  <div class="share-page">
    <header class="share-header">
      <div class="share-header__nav">
        <button class="share-header__back" @click="handleBack" aria-label="Go back" title="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <button class="share-header__dashboard" @click="handleGoToDashboard" aria-label="Go to dashboard" title="Dashboard">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M9 22V12H15V22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </header>
    
    <main class="share-content">
      <div v-if="loading" class="share-loading">
        <GSpinner />
      </div>
      
      <template v-else>
        <div class="share-page__header">
          <h1 class="share-page__title">Share Link</h1>
          <p class="share-page__subtitle">
            Share this link with couriers to guide them to your address.
          </p>
        </div>
        
        <div v-if="guidanceTitle" class="share-page__address-name">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>{{ guidanceTitle }}</span>
        </div>

        <GCard padding="lg">
          <div v-if="!courierAppUrl" class="no-link">
            <div class="no-link__icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 13C10.4295 13.5741 10.9774 14.0492 11.6066 14.3929C12.2357 14.7367 12.9315 14.9411 13.6467 14.9923C14.3618 15.0435 15.0796 14.9404 15.7513 14.6898C16.4231 14.4392 17.0331 14.0471 17.54 13.54L20.54 10.54C21.4508 9.59699 21.9548 8.33397 21.9434 7.02299C21.932 5.71201 21.4061 4.45794 20.4791 3.5309C19.5521 2.60386 18.298 2.07802 16.987 2.06663C15.676 2.05523 14.413 2.55921 13.47 3.47L11.75 5.18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M14 11C13.5705 10.4259 13.0226 9.95083 12.3934 9.60707C11.7643 9.26331 11.0685 9.05889 10.3533 9.00768C9.63821 8.95646 8.92041 9.05964 8.24866 9.31023C7.5769 9.56082 6.96689 9.95294 6.46 10.46L3.46 13.46C2.54921 14.403 2.04524 15.666 2.05663 16.977C2.06802 18.288 2.59387 19.5421 3.52091 20.4691C4.44795 21.3961 5.70201 21.922 7.01299 21.9334C8.32398 21.9448 9.58699 21.4408 10.53 20.53L12.24 18.82" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <p class="no-link__title">{{ shareLinkId ? 'Link generated but token not available' : 'No active share link' }}</p>
            <p class="no-link__text">{{ shareLinkId ? 'Generate a new link to get a shareable URL' : 'Generate a link to share your address with couriers' }}</p>
            <GButton
              variant="primary"
              full-width
              :loading="generating"
              @click="handleGenerateLink"
            >
              {{ shareLinkId ? 'Regenerate Share Link' : 'Generate Share Link' }}
            </GButton>
          </div>

          <div v-else class="link-info">
            <div class="link-status">
              <GBadge :variant="linkStatus === 'ACTIVE' ? 'success' : 'danger'">
                {{ linkStatus }}
              </GBadge>
            </div>

            <div class="link-url">
              <input
                type="text"
                :value="courierAppUrl"
                readonly
                class="link-input"
              />
              <GButton
                variant="primary"
                @click="handleCopyLink"
              >
                {{ copied ? 'Copied!' : 'Copy' }}
              </GButton>
            </div>

            <p class="link-hint">
              This link opens the courier delivery guide app.
            </p>

            <div class="link-actions">
              <GButton variant="secondary" @click="handleGenerateLink" :loading="generating">
                Regenerate
              </GButton>
              <GButton variant="danger" @click="handleRevokeLink" :loading="revoking">
                Revoke
              </GButton>
            </div>
          </div>
        </GCard>
      </template>
    </main>
  </div>
</template>

<style scoped>
.share-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--color-background);
}

.share-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background-color: var(--color-surface);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: var(--shadow-md);
  position: sticky;
  top: 0;
  z-index: 100;
}

.share-header__nav {
  display: flex;
  align-items: center;
  gap: 4px;
}

.share-header__back {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: none;
  border: none;
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.share-header__back:hover {
  background-color: var(--color-background);
  color: var(--color-text);
}

.share-header__dashboard {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: none;
  border: none;
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.2s ease;
}

.share-header__dashboard:hover {
  background-color: var(--color-background);
  color: var(--color-primary);
}

.share-content {
  flex: 1;
  padding: 24px 16px;
  max-width: 100%;
}

@media (min-width: 640px) {
  .share-content {
    max-width: 400px;
    margin: 0 auto;
  }
}

.share-loading {
  display: flex;
  justify-content: center;
  padding: 48px 0;
}

.share-page__header {
  margin-bottom: 24px;
}

.share-page__title {
  margin: 0 0 4px;
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
  line-height: 1.5;
}

.share-page__subtitle {
  margin: 0;
  font-size: var(--font-size-base);
  color: var(--color-text-muted);
  line-height: 1.4;
}

.share-page__address-name {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background-color: var(--color-primary-bg);
  border: 1px solid var(--color-primary-light);
  border-radius: var(--radius-lg);
  margin-bottom: 20px;
  color: var(--color-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.no-link {
  text-align: center;
  padding: 16px 0;
}

.no-link__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  background-color: var(--color-background);
  border-radius: var(--radius-lg);
  color: var(--color-text-muted);
}

.no-link__title {
  margin: 0 0 4px;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
}

.no-link__text {
  color: var(--color-text-muted);
  margin: 0 0 24px;
  font-size: var(--font-size-sm);
}

.link-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.link-status {
  display: flex;
  justify-content: center;
}

.link-url {
  display: flex;
  gap: var(--spacing-sm);
}

.link-input {
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  background-color: var(--color-background);
  font-family: monospace;
  color: var(--color-text-secondary);
}

.link-hint {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  text-align: center;
  margin: 0;
}

.link-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
}
</style>
