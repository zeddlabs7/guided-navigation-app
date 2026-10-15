<script setup lang="ts">
const footerLinks = {
  products: [
    { label: 'Yadul', href: 'https://yadul.app' }
  ],
  company: [
    { label: 'About', href: '#about' },
    { label: 'Products', href: '#products' },
    { label: 'Contact', href: '#contact' }
  ],
  legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' }
  ]
};
</script>

<template>
  <footer class="footer">
    <div class="container">
      <div class="footer__main">
        <div class="footer__brand">
          <div class="footer__logo">
            <img src="/logo.png" alt="Alanoor Digital Solutions" class="footer__logo-img" />
          </div>
          <p class="footer__tagline">
            A technology development company building digital products across multiple sectors.
          </p>
          <div class="footer__social">
            <a href="#" aria-label="Twitter">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a href="#" aria-label="LinkedIn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
          </div>
        </div>

        <div class="footer__links">
          <div class="footer__column">
            <h4 class="footer__column-title">Products</h4>
            <ul class="footer__list">
              <li v-for="link in footerLinks.products" :key="link.label">
                <a :href="link.href" target="_blank">{{ link.label }}</a>
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
          &copy; {{ new Date().getFullYear() }} Alanoor Digital Solutions. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background: var(--color-text);
  color: white;
  padding: var(--spacing-3xl) 0 0;
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
  margin-bottom: var(--spacing-md);
}

.footer__logo-img {
  height: 36px;
  width: auto;
  object-fit: contain;
  filter: brightness(0) invert(1);
}

.footer__tagline {
  font-size: var(--font-size-sm);
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
  margin: 0 0 var(--spacing-lg);
}

.footer__social {
  display: flex;
  gap: var(--spacing-sm);
}

.footer__social a {
  width: 36px;
  height: 36px;
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
}

.footer__bottom {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-lg) 0;
}

.footer__copyright {
  font-size: var(--font-size-sm);
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
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
}

@media (max-width: 640px) {
  .footer__links {
    grid-template-columns: 1fr;
    text-align: center;
  }
}
</style>
