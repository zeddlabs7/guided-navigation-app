<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { GButton, GCard, OTPInput, PhoneInput } from '@guidenav/ui';
import { useAuth } from '@/composables/useAuth';

const router = useRouter();
const {
  isLoading,
  error,
  isAuthenticated,
  verifyWhatsappUrl,
  verifyStatus,
  setupRecaptcha,
  sendOTP,
  verifyOTP,
  startWhatsAppVerify,
  startPolling,
  stopPolling,
  retryWhatsAppVerify,
  devBypassSignIn,
  clearError,
} = useAuth();

type Step = 'phone' | 'otp' | 'whatsapp-verify';
const currentStep = ref<Step>('phone');
const phoneNumber = ref('');
const otpCode = ref('');
const otpInputRef = ref<InstanceType<typeof OTPInput> | null>(null);
const whatsappCountdown = ref(30);
const showWhatsAppFallback = ref(false);
const devError = ref<string | null>(null);
let countdownTimer: ReturnType<typeof setInterval> | null = null;

const isPhoneValid = computed(() => {
  const phone = phoneNumber.value;
  return phone.length >= 10 && /^\+[1-9]\d{1,14}$/.test(phone);
});

const verifyToken = computed(() => {
  if (!verifyWhatsappUrl.value) return '';
  const match = verifyWhatsappUrl.value.match(/VERIFY%20([a-f0-9]+)/i);
  return match ? match[1] : '';
});

const subtitle = computed(() => {
  if (currentStep.value === 'phone') return 'Sign in with your phone number';
  if (currentStep.value === 'whatsapp-verify') return 'Verify via WhatsApp';
  return 'Enter the verification code';
});

function startWhatsAppCountdown() {
  whatsappCountdown.value = 30;
  showWhatsAppFallback.value = false;
  stopCountdown();
  countdownTimer = setInterval(() => {
    whatsappCountdown.value--;
    if (whatsappCountdown.value <= 0) {
      showWhatsAppFallback.value = true;
      stopCountdown();
    }
  }, 1000);
}

function stopCountdown() {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
}

onMounted(() => {
  setupRecaptcha('recaptcha-container');

  if (isAuthenticated.value) {
    router.push('/dashboard');
  }
});

onUnmounted(() => {
  stopCountdown();
  stopPolling();
});

async function handleSendCode() {
  clearError();
  const success = await sendOTP(phoneNumber.value);
  if (success) {
    currentStep.value = 'otp';
    startWhatsAppCountdown();
  }
}

async function handleVerifyCode(code: string) {
  otpCode.value = code;
  const success = await verifyOTP(code);
  if (success) {
    stopCountdown();
    router.push('/dashboard');
  } else {
    otpInputRef.value?.clear();
  }
}

function handleBackToPhone() {
  currentStep.value = 'phone';
  stopCountdown();
  stopPolling();
  clearError();
}

async function handleResendCode() {
  clearError();
  otpInputRef.value?.clear();
  await sendOTP(phoneNumber.value);
  startWhatsAppCountdown();
}

async function handleStartWhatsAppVerify() {
  clearError();
  stopCountdown();
  const success = await startWhatsAppVerify(phoneNumber.value);
  if (success) {
    currentStep.value = 'whatsapp-verify';
    startPolling(() => {
      router.push('/dashboard');
    });
  }
}

function handleOpenWhatsApp() {
  if (verifyWhatsappUrl.value) {
    window.open(verifyWhatsappUrl.value, '_blank');
  }
}

async function handleDevBypass() {
  clearError();
  devError.value = null;
  const success = await devBypassSignIn();
  if (success) {
    router.push('/dashboard');
  } else {
    devError.value = error.value;
    clearError();
  }
}

async function handleRetryVerify() {
  clearError();
  const success = await retryWhatsAppVerify();
  if (success) {
    startPolling(() => {
      router.push('/dashboard');
    });
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-container">
      <header class="login-header">
        <img src="/logo-eng.png" alt="Arriveo" class="login-logo" />
        <p class="login-subtitle">{{ subtitle }}</p>
      </header>

      <GCard padding="lg">
        <!-- Phone Number Step -->
        <form 
          v-if="currentStep === 'phone'" 
          class="login-form" 
          @submit.prevent="handleSendCode"
        >
          <PhoneInput
            v-model="phoneNumber"
            label="Phone Number"
            placeholder="Enter phone number"
            :error="error ?? undefined"
            :disabled="isLoading"
          />

          <GButton
            type="submit"
            variant="primary"
            full-width
            :loading="isLoading"
            :disabled="!isPhoneValid || isLoading"
          >
            Send Verification Code
          </GButton>
        </form>

        <!-- SMS OTP Verification Step -->
        <div v-else-if="currentStep === 'otp'" class="login-form">
          <p class="otp-sent-message">
            Code sent to <strong>{{ phoneNumber }}</strong>
          </p>

          <OTPInput
            ref="otpInputRef"
            v-model="otpCode"
            :length="6"
            :disabled="isLoading"
            :error="error ?? undefined"
            @complete="handleVerifyCode"
          />

          <GButton
            variant="primary"
            full-width
            :loading="isLoading"
            :disabled="otpCode.length !== 6 || isLoading"
            @click="handleVerifyCode(otpCode)"
          >
            Verify Code
          </GButton>

          <div class="otp-actions">
            <GButton
              variant="ghost"
              size="sm"
              :disabled="isLoading"
              @click="handleResendCode"
            >
              Resend Code
            </GButton>

            <GButton
              variant="ghost"
              size="sm"
              :disabled="isLoading"
              @click="handleBackToPhone"
            >
              Change Number
            </GButton>
          </div>

          <div class="whatsapp-fallback">
            <p v-if="!showWhatsAppFallback" class="whatsapp-countdown">
              Didn't receive? Use WhatsApp in {{ whatsappCountdown }}s...
            </p>
            <GButton
              v-else
              variant="ghost"
              full-width
              :loading="isLoading"
              :disabled="isLoading"
              @click="handleStartWhatsAppVerify"
            >
              Didn't receive? Verify via WhatsApp
            </GButton>
          </div>
        </div>

        <!-- WhatsApp Verification Step -->
        <div v-else-if="currentStep === 'whatsapp-verify'" class="login-form">
          <p class="otp-sent-message">
            Verify your number <strong>{{ phoneNumber }}</strong> via WhatsApp
          </p>

          <p class="verify-instructions">
            Tap the button below to open WhatsApp. Send the pre-filled message to verify your number.
          </p>

          <GButton
            variant="primary"
            full-width
            :disabled="isLoading || !verifyWhatsappUrl"
            @click="handleOpenWhatsApp"
          >
            Open WhatsApp to Verify
          </GButton>

          <div v-if="verifyToken" class="verify-code-fallback">
            <p class="verify-code-label">If the message isn't pre-filled, send this manually:</p>
            <code class="verify-code-value">VERIFY {{ verifyToken }}</code>
          </div>

          <div v-if="verifyStatus === 'pending'" class="verify-waiting">
            <div class="verify-spinner" />
            <p class="verify-waiting-text">Waiting for verification...</p>
          </div>

          <div v-if="verifyStatus === 'verified'" class="verify-success">
            <p>Verified! Signing you in...</p>
          </div>

          <p v-if="error" class="verify-error">{{ error }}</p>

          <div class="otp-actions">
            <GButton
              v-if="verifyStatus === 'expired'"
              variant="ghost"
              size="sm"
              :loading="isLoading"
              :disabled="isLoading"
              @click="handleRetryVerify"
            >
              Try Again
            </GButton>

            <GButton
              variant="ghost"
              size="sm"
              :disabled="isLoading"
              @click="handleBackToPhone"
            >
              Change Number
            </GButton>
          </div>
        </div>
      </GCard>

      <div class="dev-bypass">
        <p v-if="devError" class="dev-bypass-error">{{ devError }}</p>
        <GButton
          variant="ghost"
          size="sm"
          full-width
          :loading="isLoading"
          :disabled="isLoading"
          @click="handleDevBypass"
        >
          Dev: Sign in as test user
        </GButton>
      </div>
      
      <!-- Invisible reCAPTCHA container -->
      <div id="recaptcha-container"></div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-md);
}

.login-container {
  width: 100%;
  max-width: 400px;
}

.login-header {
  text-align: center;
  margin-bottom: var(--spacing-xl);
}

.login-logo {
  height: 56px;
  width: auto;
  object-fit: contain;
  margin-bottom: var(--spacing-sm);
}

.login-subtitle {
  color: var(--color-text-muted);
  margin: 0;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.otp-sent-message {
  text-align: center;
  color: var(--color-text-muted);
  margin: 0;
}

.otp-sent-message strong {
  color: var(--color-text);
}

.otp-actions {
  display: flex;
  justify-content: center;
  gap: var(--spacing-md);
}

.whatsapp-fallback {
  text-align: center;
  border-top: 1px solid var(--color-border, #e5e7eb);
  padding-top: var(--spacing-md);
}

.whatsapp-countdown {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm, 0.875rem);
  margin: 0;
}

.verify-instructions {
  text-align: center;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm, 0.875rem);
  margin: 0;
  line-height: 1.5;
}

.verify-code-fallback {
  text-align: center;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-surface, #f9fafb);
  border: 1px dashed var(--color-border, #e5e7eb);
  border-radius: 8px;
}

.verify-code-label {
  color: var(--color-text-muted);
  font-size: var(--font-size-xs, 0.75rem);
  margin: 0 0 var(--spacing-xs) 0;
}

.verify-code-value {
  font-size: var(--font-size-lg, 1.125rem);
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--color-text);
  user-select: all;
}

.verify-waiting {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
}

.verify-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid var(--color-border, #e5e7eb);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.verify-waiting-text {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm, 0.875rem);
  margin: 0;
}

.verify-success {
  text-align: center;
  color: var(--color-primary);
  font-weight: 600;
}

.verify-success p {
  margin: 0;
}

.verify-error {
  text-align: center;
  color: var(--color-error, #ef4444);
  font-size: var(--font-size-sm, 0.875rem);
  margin: 0;
}

.dev-bypass {
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-md);
  border-top: 1px dashed var(--color-border, #e5e7eb);
  opacity: 0.6;
}

.dev-bypass-error {
  margin: 0 0 var(--spacing-sm);
  text-align: center;
  color: var(--color-error, #ef4444);
  font-size: var(--font-size-sm, 0.875rem);
}

#recaptcha-container {
  position: fixed;
  bottom: 0;
  left: 0;
}
</style>
