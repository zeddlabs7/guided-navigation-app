<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { locale } = useI18n();
const currentLang = ref(locale.value);

const setLanguage = (lang: string) => {
  currentLang.value = lang;
  locale.value = lang;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
};

const footerLinks = {
  product: [
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Features', href: '#features' },
    { label: 'For Recipients', href: '#recipients' },
    { label: 'For Couriers', href: '#couriers' }
  ],
  company: [
    { label: 'About Us', href: '#' },
    { label: 'Blog', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Contact', href: '#' }
  ],
  legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Cookie Policy', href: '#' }
  ]
};
</script>

<template>
  <footer class="footer">
    <div class="landing-container">
      <div class="footer__main">
        <div class="footer__brand">
          <div class="footer__logo">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="14" fill="var(--color-primary)" />
              <path d="M16 8L22 20H10L16 8Z" fill="white" />
              <circle cx="16" cy="22" r="2" fill="white" />
            </svg>
            <span class="footer__brand-name">Arriveo</span>
          </div>
          <p class="footer__tagline">
            Visual delivery guidance that helps couriers find your exact location every time.
          </p>
          <div class="footer__social">
            <a href="#" aria-label="Twitter">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a href="#" aria-label="LinkedIn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
            <a href="#" aria-label="Instagram">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
          </div>
        </div>

        <div class="footer__links">
          <div class="footer__column">
            <h4 class="footer__column-title">Product</h4>
            <ul class="footer__list">
              <li v-for="link in footerLinks.product" :key="link.label">
                <a :href="link.href">{{ link.label }}</a>
              </li>
            </ul>
          </div>

          <div class="footer__column">
            <h4 class="footer__column-title">Company</h4>
            <ul class="footer__list">
              <li v-for="link in footerLinks.company" :key="link.label">
                <a :href="link.href">{{ link.label }}</a>
              </li>
            </ul>
          </div>

          <div class="footer__column">
            <h4 class="footer__column-title">Legal</h4>
            <ul class="footer__list">
              <li v-for="link in footerLinks.legal" :key="link.label">
                <a :href="link.href">{{ link.label }}</a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div class="footer__bottom">
        <p class="footer__copyright">
          &copy; {{ new Date().getFullYear() }} Arriveo. All rights reserved.
        </p>

        <div class="footer__lang">
          <button 
            :class="['footer__lang-btn', { 'footer__lang-btn--active': currentLang === 'en' }]"
            @click="setLanguage('en')"
          >
            English
          </button>
          <button 
            :class="['footer__lang-btn', { 'footer__lang-btn--active': currentLang === 'ar' }]"
            @click="setLanguage('ar')"
          >
            العربية
          </button>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background: var(--color-text);
  color: white;
  padding: 4rem 0 0;
}

.footer__main {
  display: grid;
  grid-template-columns: 1.5fr 2fr;
  gap: var(--spacing-2xl);
  padding-bottom: var(--spacing-2xl);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.footer__brand {
  max-width: 300px;
}

.footer__logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.footer__brand-name {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
}

.footer__tagline {
  font-size: var(--font-size-sm);
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
  margin: 0 0 var(--spacing-lg);
}

.footer__social {
  display: flex;
  gap: var(--spacing-md);
}

.footer__social a {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  transition: background-color 0.2s;
}

.footer__social a:hover {
  background: rgba(255, 255, 255, 0.2);
}

.footer__links {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-xl);
}

.footer__column-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 var(--spacing-md);
  color: rgba(255, 255, 255, 0.5);
}

.footer__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.footer__list a {
  font-size: var(--font-size-sm);
  color: rgba(255, 255, 255, 0.8);
  transition: color 0.2s;
}

.footer__list a:hover {
  color: white;
  text-decoration: none;
}

.footer__bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-lg) 0;
}

.footer__copyright {
  font-size: var(--font-size-sm);
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}

.footer__lang {
  display: flex;
  gap: var(--spacing-sm);
}

.footer__lang-btn {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.7);
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all 0.2s;
}

.footer__lang-btn:hover {
  border-color: rgba(255, 255, 255, 0.4);
  color: white;
}

.footer__lang-btn--active {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
  color: white;
}

@media (max-width: 968px) {
  .footer__main {
    grid-template-columns: 1fr;
  }

  .footer__brand {
    max-width: 100%;
    text-align: center;
  }

  .footer__logo {
    justify-content: center;
  }

  .footer__social {
    justify-content: center;
  }

  .footer__links {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 640px) {
  .footer__links {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .footer__bottom {
    flex-direction: column;
    gap: var(--spacing-md);
    text-align: center;
  }
}
</style>
