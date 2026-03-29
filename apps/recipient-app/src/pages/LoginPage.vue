<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { GButton, GCard, GInput, OTPInput } from '@guidenav/ui';
import { useAuth } from '@/composables/useAuth';

const router = useRouter();
const { 
  isLoading, 
  error, 
  isAuthenticated,
  setupRecaptcha, 
  sendOTP, 
  verifyOTP, 
  clearError 
} = useAuth();

type Step = 'phone' | 'otp';
const currentStep = ref<Step>('phone');
const phoneNumber = ref('');
const otpCode = ref('');
const otpInputRef = ref<InstanceType<typeof OTPInput> | null>(null);

const formattedPhone = computed(() => {
  let phone = phoneNumber.value.trim();
  if (phone && !phone.startsWith('+')) {
    phone = '+' + phone;
  }
  return phone;
});

const isPhoneValid = computed(() => {
  const phone = formattedPhone.value;
  return phone.length >= 10 && /^\+[1-9]\d{1,14}$/.test(phone);
});

onMounted(() => {
  setupRecaptcha('recaptcha-container');
  
  if (isAuthenticated.value) {
    router.push('/dashboard');
  }
});

async function handleSendCode() {
  clearError();
  const success = await sendOTP(formattedPhone.value);
  if (success) {
    currentStep.value = 'otp';
  }
}

async function handleVerifyCode(code: string) {
  otpCode.value = code;
  const success = await verifyOTP(code);
  if (success) {
    router.push('/dashboard');
  } else {
    otpInputRef.value?.clear();
  }
}

function handleBackToPhone() {
  currentStep.value = 'phone';
  clearError();
}

async function handleResendCode() {
  clearError();
  otpInputRef.value?.clear();
  await sendOTP(formattedPhone.value);
}
</script>

<template>
  <div class="login-page">
    <div class="login-container">
      <header class="login-header">
        <h1 class="login-title">Delivery Guidance</h1>
        <p class="login-subtitle">
          {{ currentStep === 'phone' 
            ? 'Sign in with your phone number' 
            : 'Enter the verification code' 
          }}
        </p>
      </header>

      <GCard padding="lg">
        <!-- Phone Number Step -->
        <form 
          v-if="currentStep === 'phone'" 
          class="login-form" 
          @submit.prevent="handleSendCode"
        >
          <GInput
            v-model="phoneNumber"
            type="tel"
            label="Phone Number"
            placeholder="+1234567890"
            :error="error ?? undefined"
            :disabled="isLoading"
          />

          <p class="phone-hint">
            Enter your phone number with country code (e.g., +1 for US)
          </p>

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

        <!-- OTP Verification Step -->
        <div v-else class="login-form">
          <p class="otp-sent-message">
            Code sent to <strong>{{ formattedPhone }}</strong>
          </p>

          <OTPInput
            ref="otpInputRef"
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

.phone-hint {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin: calc(-1 * var(--spacing-sm)) 0 0 0;
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

#recaptcha-container {
  position: fixed;
  bottom: 0;
  left: 0;
}
</style>
