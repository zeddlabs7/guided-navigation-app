<script setup lang="ts">
import { ref } from 'vue';

const formData = ref({
  name: '',
  email: '',
  message: ''
});

const isSubmitting = ref(false);
const isSubmitted = ref(false);

const handleSubmit = () => {
  isSubmitting.value = true;
  setTimeout(() => {
    isSubmitting.value = false;
    isSubmitted.value = true;
    formData.value = { name: '', email: '', message: '' };
  }, 1000);
};
</script>

<template>
  <section id="contact" class="contact">
    <div class="container">
      <div class="contact__inner">
        <div class="contact__info">
          <span class="contact__label">Contact Us</span>
          <h2 class="contact__title">Let's Build Something Together</h2>
          <p class="contact__subtitle">
            Whether you have a question about our products, want to explore partnerships, 
            or just want to say hello — we'd love to hear from you.
          </p>

          <div class="contact__details">
            <div class="contact__detail">
              <div class="contact__detail-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <div>
                <h4 class="contact__detail-title">Email</h4>
                <a href="mailto:hello@alanoor.net" class="contact__detail-value">hello@alanoor.net</a>
              </div>
            </div>

            <div class="contact__detail">
              <div class="contact__detail-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div>
                <h4 class="contact__detail-title">Location</h4>
                <p class="contact__detail-value">Remote-first company</p>
              </div>
            </div>

            <div class="contact__detail">
              <div class="contact__detail-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div>
                <h4 class="contact__detail-title">Response Time</h4>
                <p class="contact__detail-value">Within 24 hours</p>
              </div>
            </div>
          </div>
        </div>

        <div class="contact__form-wrapper">
          <form v-if="!isSubmitted" class="contact__form" @submit.prevent="handleSubmit">
            <div class="contact__field">
              <label for="name" class="contact__field-label">Name</label>
              <input 
                id="name"
                v-model="formData.name"
                type="text" 
                placeholder="Your name"
                class="contact__input"
                required
              />
            </div>
            <div class="contact__field">
              <label for="email" class="contact__field-label">Email</label>
              <input 
                id="email"
                v-model="formData.email"
                type="email" 
                placeholder="you@example.com"
                class="contact__input"
                required
              />
            </div>
            <div class="contact__field">
              <label for="message" class="contact__field-label">Message</label>
              <textarea 
                id="message"
                v-model="formData.message"
                placeholder="Tell us what you're thinking..."
                class="contact__textarea"
                rows="4"
                required
              ></textarea>
            </div>
            <button type="submit" class="contact__submit" :disabled="isSubmitting">
              {{ isSubmitting ? 'Sending...' : 'Send Message' }}
              <svg v-if="!isSubmitting" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </form>

          <div v-else class="contact__success">
            <div class="contact__success-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="9 12 12 15 16 9" />
              </svg>
            </div>
            <h3 class="contact__success-title">Message Sent!</h3>
            <p class="contact__success-desc">Thanks for reaching out. We'll get back to you within 24 hours.</p>
            <button class="contact__success-btn" @click="isSubmitted = false">Send Another</button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.contact {
  background: var(--color-surface);
}

.contact__inner {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-3xl);
  align-items: start;
}

.contact__label {
  display: inline-block;
  background: var(--color-primary-bg);
  color: var(--color-primary-dark);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-full);
  margin-bottom: var(--spacing-md);
  border: 1px solid var(--color-primary-light);
}

.contact__title {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text);
  margin: 0 0 var(--spacing-md);
  line-height: 1.2;
}

.contact__subtitle {
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
  margin: 0 0 var(--spacing-2xl);
  line-height: 1.7;
}

.contact__details {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.contact__detail {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
}

.contact__detail-icon {
  width: 44px;
  height: 44px;
  background: var(--color-primary-light);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary-dark);
  flex-shrink: 0;
}

.contact__detail-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  margin: 0 0 2px;
}

.contact__detail-value {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

a.contact__detail-value:hover {
  color: var(--color-primary);
}

.contact__form-wrapper {
  background: var(--color-background);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
}

.contact__form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.contact__field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.contact__field-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
}

.contact__input,
.contact__textarea {
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  padding: var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  transition: border-color 0.2s, box-shadow 0.2s;
  outline: none;
}

.contact__input:focus,
.contact__textarea:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(0, 180, 216, 0.1);
}

.contact__input::placeholder,
.contact__textarea::placeholder {
  color: var(--color-text-muted);
}

.contact__textarea {
  resize: vertical;
  min-height: 100px;
}

.contact__submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  background: var(--color-button);
  color: white;
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  padding: var(--spacing-md) var(--spacing-xl);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color 0.2s, transform 0.2s;
}

.contact__submit:hover:not(:disabled) {
  background: var(--color-button-hover);
  transform: translateY(-1px);
}

.contact__submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.contact__success {
  text-align: center;
  padding: var(--spacing-xl) 0;
}

.contact__success-icon {
  margin-bottom: var(--spacing-lg);
}

.contact__success-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  margin: 0 0 var(--spacing-sm);
}

.contact__success-desc {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  margin: 0 0 var(--spacing-lg);
}

.contact__success-btn {
  background: none;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
}

.contact__success-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

@media (max-width: 968px) {
  .contact__inner {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 768px) {
  .contact__title {
    font-size: var(--font-size-4xl);
  }
}
</style>
