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
  setupRecaptcha, 
  sendOTP, 
  verifyOTP,
  sendWhatsAppCode,
  verifyWhatsAppCode,
  clearError 
} = useAuth();

type Step = 'phone' | 'otp' | 'whatsapp-otp';
const currentStep = ref<Step>('phone');
const phoneNumber = ref('');
const otpCode = ref('');
const otpInputRef = ref<InstanceType<typeof OTPInput> | null>(null);
const whatsappOtpInputRef = ref<InstanceType<typeof OTPInput> | null>(null);
const whatsappCountdown = ref(30);
const showWhatsAppFallback = ref(false);
let countdownTimer: ReturnType<typeof setInterval> | null = null;

const isPhoneValid = computed(() => {
  const phone = phoneNumber.value;
  return phone.length >= 10 && /^\+[1-9]\d{1,14}$/.test(phone);
});

const subtitle = computed(() => {
  if (currentStep.value === 'phone') return 'Sign in with your phone number';
  if (currentStep.value === 'whatsapp-otp') return 'Enter the WhatsApp verification code';
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
  clearError();
}

async function handleResendCode() {
  clearError();
  otpInputRef.value?.clear();
  await sendOTP(phoneNumber.value);
  startWhatsAppCountdown();
}

async function handleSendWhatsApp() {
  clearError();
  stopCountdown();
  const success = await sendWhatsAppCode(phoneNumber.value);
  if (success) {
    currentStep.value = 'whatsapp-otp';
    otpCode.value = '';
  }
}

async function handleVerifyWhatsAppCode(code: string) {
  otpCode.value = code;
  const success = await verifyWhatsAppCode(phoneNumber.value, code);
  if (success) {
    router.push('/dashboard');
  } else {
    whatsappOtpInputRef.value?.clear();
  }
}

async function handleResendWhatsApp() {
  clearError();
  whatsappOtpInputRef.value?.clear();
  await sendWhatsAppCode(phoneNumber.value);
}
</script>

<template>
  <div class="login-page">
    <div class="login-container">
      <header class="login-header">
        <h1 class="login-title">Arriveo</h1>
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
              @click="handleSendWhatsApp"
            >
              Didn't receive? Send code via WhatsApp
            </GButton>
          </div>
        </div>

        <!-- WhatsApp OTP Verification Step -->
        <div v-else-if="currentStep === 'whatsapp-otp'" class="login-form">
          <p class="otp-sent-message">
            Code sent via WhatsApp to <strong>{{ phoneNumber }}</strong>
          </p>

          <OTPInput
            ref="whatsappOtpInputRef"
            v-model="otpCode"
            :length="6"
            :disabled="isLoading"
            :error="error ?? undefined"
            @complete="handleVerifyWhatsAppCode"
          />

          <GButton
            variant="primary"
            full-width
            :loading="isLoading"
            :disabled="otpCode.length !== 6 || isLoading"
            @click="handleVerifyWhatsAppCode(otpCode)"
          >
            Verify Code
          </GButton>

          <div class="otp-actions">
            <GButton
              variant="ghost"
              size="sm"
              :disabled="isLoading"
              @click="handleResendWhatsApp"
            >
              Resend WhatsApp Code
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

.login-title {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  margin: 0 0 var(--spacing-sm) 0;
  color: var(--color-primary);
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

#recaptcha-container {
  position: fixed;
  bottom: 0;
  left: 0;
}
</style>
