<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';

interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

interface Props {
  modelValue: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
  error: '',
  disabled: false,
  placeholder: 'Phone number',
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const countries: Country[] = [
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪' },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
  { code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸' },
  { code: 'PT', name: 'Portugal', dialCode: '+351', flag: '🇵🇹' },
  { code: 'NL', name: 'Netherlands', dialCode: '+31', flag: '🇳🇱' },
  { code: 'BE', name: 'Belgium', dialCode: '+32', flag: '🇧🇪' },
  { code: 'CH', name: 'Switzerland', dialCode: '+41', flag: '🇨🇭' },
  { code: 'AT', name: 'Austria', dialCode: '+43', flag: '🇦🇹' },
  { code: 'SE', name: 'Sweden', dialCode: '+46', flag: '🇸🇪' },
  { code: 'NO', name: 'Norway', dialCode: '+47', flag: '🇳🇴' },
  { code: 'DK', name: 'Denmark', dialCode: '+45', flag: '🇩🇰' },
  { code: 'FI', name: 'Finland', dialCode: '+358', flag: '🇫🇮' },
  { code: 'IE', name: 'Ireland', dialCode: '+353', flag: '🇮🇪' },
  { code: 'PL', name: 'Poland', dialCode: '+48', flag: '🇵🇱' },
  { code: 'CZ', name: 'Czech Republic', dialCode: '+420', flag: '🇨🇿' },
  { code: 'RU', name: 'Russia', dialCode: '+7', flag: '🇷🇺' },
  { code: 'UA', name: 'Ukraine', dialCode: '+380', flag: '🇺🇦' },
  { code: 'TR', name: 'Turkey', dialCode: '+90', flag: '🇹🇷' },
  { code: 'GR', name: 'Greece', dialCode: '+30', flag: '🇬🇷' },
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳' },
  { code: 'PK', name: 'Pakistan', dialCode: '+92', flag: '🇵🇰' },
  { code: 'BD', name: 'Bangladesh', dialCode: '+880', flag: '🇧🇩' },
  { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳' },
  { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', dialCode: '+82', flag: '🇰🇷' },
  { code: 'TW', name: 'Taiwan', dialCode: '+886', flag: '🇹🇼' },
  { code: 'HK', name: 'Hong Kong', dialCode: '+852', flag: '🇭🇰' },
  { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬' },
  { code: 'MY', name: 'Malaysia', dialCode: '+60', flag: '🇲🇾' },
  { code: 'TH', name: 'Thailand', dialCode: '+66', flag: '🇹🇭' },
  { code: 'VN', name: 'Vietnam', dialCode: '+84', flag: '🇻🇳' },
  { code: 'PH', name: 'Philippines', dialCode: '+63', flag: '🇵🇭' },
  { code: 'ID', name: 'Indonesia', dialCode: '+62', flag: '🇮🇩' },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦' },
  { code: 'EG', name: 'Egypt', dialCode: '+20', flag: '🇪🇬' },
  { code: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦' },
  { code: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬' },
  { code: 'KE', name: 'Kenya', dialCode: '+254', flag: '🇰🇪' },
  { code: 'MA', name: 'Morocco', dialCode: '+212', flag: '🇲🇦' },
  { code: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷' },
  { code: 'AR', name: 'Argentina', dialCode: '+54', flag: '🇦🇷' },
  { code: 'MX', name: 'Mexico', dialCode: '+52', flag: '🇲🇽' },
  { code: 'CO', name: 'Colombia', dialCode: '+57', flag: '🇨🇴' },
  { code: 'CL', name: 'Chile', dialCode: '+56', flag: '🇨🇱' },
  { code: 'PE', name: 'Peru', dialCode: '+51', flag: '🇵🇪' },
  { code: 'VE', name: 'Venezuela', dialCode: '+58', flag: '🇻🇪' },
  { code: 'NZ', name: 'New Zealand', dialCode: '+64', flag: '🇳🇿' },
  { code: 'IL', name: 'Israel', dialCode: '+972', flag: '🇮🇱' },
  { code: 'QA', name: 'Qatar', dialCode: '+974', flag: '🇶🇦' },
  { code: 'KW', name: 'Kuwait', dialCode: '+965', flag: '🇰🇼' },
  { code: 'BH', name: 'Bahrain', dialCode: '+973', flag: '🇧🇭' },
  { code: 'OM', name: 'Oman', dialCode: '+968', flag: '🇴🇲' },
  { code: 'JO', name: 'Jordan', dialCode: '+962', flag: '🇯🇴' },
  { code: 'LB', name: 'Lebanon', dialCode: '+961', flag: '🇱🇧' },
  { code: 'IQ', name: 'Iraq', dialCode: '+964', flag: '🇮🇶' },
  { code: 'IR', name: 'Iran', dialCode: '+98', flag: '🇮🇷' },
  { code: 'AF', name: 'Afghanistan', dialCode: '+93', flag: '🇦🇫' },
  { code: 'NP', name: 'Nepal', dialCode: '+977', flag: '🇳🇵' },
  { code: 'LK', name: 'Sri Lanka', dialCode: '+94', flag: '🇱🇰' },
  { code: 'MM', name: 'Myanmar', dialCode: '+95', flag: '🇲🇲' },
  { code: 'KH', name: 'Cambodia', dialCode: '+855', flag: '🇰🇭' },
  { code: 'LA', name: 'Laos', dialCode: '+856', flag: '🇱🇦' },
];

const isOpen = ref(false);
const searchQuery = ref('');
const selectedCountry = ref<Country>(countries[0]);
const phoneNumber = ref('');
const dropdownRef = ref<HTMLElement | null>(null);
const searchInputRef = ref<HTMLInputElement | null>(null);
const focusedIndex = ref(0);

const filteredCountries = computed(() => {
  if (!searchQuery.value) return countries;
  const query = searchQuery.value.toLowerCase();
  return countries.filter(
    (country) =>
      country.name.toLowerCase().includes(query) ||
      country.dialCode.includes(query) ||
      country.code.toLowerCase().includes(query)
  );
});

const fullPhoneNumber = computed(() => {
  const number = phoneNumber.value.replace(/\D/g, '');
  if (!number) return '';
  return `${selectedCountry.value.dialCode}${number}`;
});

watch(fullPhoneNumber, (newValue) => {
  emit('update:modelValue', newValue);
});

watch(
  () => props.modelValue,
  (newValue) => {
    if (!newValue) {
      phoneNumber.value = '';
      return;
    }
    
    const sortedCountries = [...countries].sort(
      (a, b) => b.dialCode.length - a.dialCode.length
    );
    
    for (const country of sortedCountries) {
      if (newValue.startsWith(country.dialCode)) {
        selectedCountry.value = country;
        phoneNumber.value = newValue.slice(country.dialCode.length);
        return;
      }
    }
    
    phoneNumber.value = newValue.startsWith('+') ? newValue.slice(1) : newValue;
  },
  { immediate: true }
);

function toggleDropdown() {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    searchQuery.value = '';
    focusedIndex.value = 0;
    setTimeout(() => {
      searchInputRef.value?.focus();
    }, 50);
  }
}

function closeDropdown() {
  isOpen.value = false;
  searchQuery.value = '';
}

function selectCountry(country: Country) {
  selectedCountry.value = country;
  closeDropdown();
}

function handleKeydown(event: KeyboardEvent) {
  if (!isOpen.value) return;
  
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      focusedIndex.value = Math.min(
        focusedIndex.value + 1,
        filteredCountries.value.length - 1
      );
      scrollToFocused();
      break;
    case 'ArrowUp':
      event.preventDefault();
      focusedIndex.value = Math.max(focusedIndex.value - 1, 0);
      scrollToFocused();
      break;
    case 'Enter':
      event.preventDefault();
      if (filteredCountries.value[focusedIndex.value]) {
        selectCountry(filteredCountries.value[focusedIndex.value]);
      }
      break;
    case 'Escape':
      closeDropdown();
      break;
  }
}

function scrollToFocused() {
  const list = dropdownRef.value?.querySelector('.phone-input__country-list');
  const focused = list?.querySelector('.phone-input__country-option--focused');
  if (focused && list) {
    focused.scrollIntoView({ block: 'nearest' });
  }
}

function handleClickOutside(event: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    closeDropdown();
  }
}

watch(searchQuery, () => {
  focusedIndex.value = 0;
});

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
  <div class="phone-input-wrapper">
    <label v-if="label" class="phone-input__label">{{ label }}</label>
    
    <div 
      class="phone-input"
      :class="{ 
        'phone-input--error': error, 
        'phone-input--disabled': disabled,
        'phone-input--focused': isOpen
      }"
    >
      <!-- Country Code Selector -->
      <div class="phone-input__country" ref="dropdownRef">
        <button
          type="button"
          class="phone-input__country-trigger"
          :disabled="disabled"
          @click="toggleDropdown"
          @keydown="handleKeydown"
        >
          <span class="phone-input__flag">{{ selectedCountry.flag }}</span>
          <span class="phone-input__dial-code">{{ selectedCountry.dialCode }}</span>
          <svg 
            class="phone-input__chevron"
            :class="{ 'phone-input__chevron--open': isOpen }"
            width="12" 
            height="12" 
            viewBox="0 0 12 12" 
            fill="none"
          >
            <path 
              d="M3 4.5L6 7.5L9 4.5" 
              stroke="currentColor" 
              stroke-width="1.5" 
              stroke-linecap="round" 
              stroke-linejoin="round"
            />
          </svg>
        </button>
        
        <!-- Dropdown -->
        <Transition name="dropdown">
          <div v-if="isOpen" class="phone-input__dropdown">
            <div class="phone-input__search">
              <svg 
                class="phone-input__search-icon" 
                width="16" 
                height="16" 
                viewBox="0 0 16 16" 
                fill="none"
              >
                <path 
                  d="M7 12C9.76142 12 12 9.76142 12 7C12 4.23858 9.76142 2 7 2C4.23858 2 2 4.23858 2 7C2 9.76142 4.23858 12 7 12Z" 
                  stroke="currentColor" 
                  stroke-width="1.5" 
                  stroke-linecap="round" 
                  stroke-linejoin="round"
                />
                <path 
                  d="M14 14L10.5 10.5" 
                  stroke="currentColor" 
                  stroke-width="1.5" 
                  stroke-linecap="round" 
                  stroke-linejoin="round"
                />
              </svg>
              <input
                ref="searchInputRef"
                v-model="searchQuery"
                type="text"
                class="phone-input__search-input"
                placeholder="Search countries..."
                @keydown="handleKeydown"
              />
            </div>
            
            <ul class="phone-input__country-list">
              <li
                v-for="(country, index) in filteredCountries"
                :key="country.code"
                class="phone-input__country-option"
                :class="{
                  'phone-input__country-option--selected': selectedCountry.code === country.code,
                  'phone-input__country-option--focused': focusedIndex === index
                }"
                @click="selectCountry(country)"
              >
                <span class="phone-input__option-flag">{{ country.flag }}</span>
                <span class="phone-input__option-name">{{ country.name }}</span>
                <span class="phone-input__option-dial-code">{{ country.dialCode }}</span>
              </li>
              
              <li v-if="filteredCountries.length === 0" class="phone-input__no-results">
                No countries found
              </li>
            </ul>
          </div>
        </Transition>
      </div>
      
      <!-- Divider -->
      <div class="phone-input__divider"></div>
      
      <!-- Phone Number Input -->
      <input
        v-model="phoneNumber"
        type="tel"
        class="phone-input__number"
        :placeholder="placeholder"
        :disabled="disabled"
        @keydown.enter.prevent
      />
    </div>
    
    <span v-if="error" class="phone-input__error">{{ error }}</span>
  </div>
</template>

<style scoped>
.phone-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.phone-input__label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text, #374151);
}

.phone-input {
  display: flex;
  align-items: center;
  border: 1px solid var(--color-border, #d1d5db);
  border-radius: 0.5rem;
  background-color: var(--color-surface, #ffffff);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  overflow: visible;
}

.phone-input--focused,
.phone-input:focus-within {
  border-color: var(--color-primary, #2563eb);
  box-shadow: 0 0 0 3px var(--color-primary-light, rgba(37, 99, 235, 0.1));
}

.phone-input--error {
  border-color: var(--color-danger, #dc2626);
}

.phone-input--error:focus-within {
  box-shadow: 0 0 0 3px var(--color-danger-light, rgba(220, 38, 38, 0.1));
}

.phone-input--disabled {
  background-color: var(--color-disabled, #f3f4f6);
  cursor: not-allowed;
}

.phone-input__country {
  position: relative;
}

.phone-input__country-trigger {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.75rem 0.5rem 0.75rem 1rem;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--color-text, #1f2937);
  font-size: 0.9375rem;
  transition: background-color 0.15s ease;
  border-radius: 0.5rem 0 0 0.5rem;
}

.phone-input__country-trigger:hover:not(:disabled) {
  background-color: var(--color-hover, rgba(0, 0, 0, 0.04));
}

.phone-input__country-trigger:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.phone-input__flag {
  font-size: 1.25rem;
  line-height: 1;
}

.phone-input__dial-code {
  font-weight: 500;
  min-width: 2.5rem;
}

.phone-input__chevron {
  color: var(--color-text-muted, #6b7280);
  transition: transform 0.2s ease;
}

.phone-input__chevron--open {
  transform: rotate(180deg);
}

.phone-input__dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 100;
  width: 280px;
  max-height: 320px;
  background: var(--color-surface, #ffffff);
  border: 1px solid var(--color-border, #d1d5db);
  border-radius: 0.5rem;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.phone-input__search {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}

.phone-input__search-icon {
  flex-shrink: 0;
  color: var(--color-text-muted, #9ca3af);
}

.phone-input__search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 0.875rem;
  background: transparent;
  color: var(--color-text, #1f2937);
}

.phone-input__search-input::placeholder {
  color: var(--color-text-muted, #9ca3af);
}

.phone-input__country-list {
  list-style: none;
  margin: 0;
  padding: 0.25rem 0;
  overflow-y: auto;
  max-height: 260px;
}

.phone-input__country-option {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.625rem 0.75rem;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.phone-input__country-option:hover,
.phone-input__country-option--focused {
  background-color: var(--color-hover, rgba(0, 0, 0, 0.04));
}

.phone-input__country-option--selected {
  background-color: var(--color-primary-light, rgba(37, 99, 235, 0.08));
}

.phone-input__country-option--selected:hover,
.phone-input__country-option--selected.phone-input__country-option--focused {
  background-color: var(--color-primary-light, rgba(37, 99, 235, 0.12));
}

.phone-input__option-flag {
  font-size: 1.125rem;
  line-height: 1;
}

.phone-input__option-name {
  flex: 1;
  font-size: 0.875rem;
  color: var(--color-text, #1f2937);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.phone-input__option-dial-code {
  font-size: 0.8125rem;
  color: var(--color-text-muted, #6b7280);
  font-weight: 500;
}

.phone-input__no-results {
  padding: 1rem;
  text-align: center;
  color: var(--color-text-muted, #9ca3af);
  font-size: 0.875rem;
}

.phone-input__divider {
  width: 1px;
  height: 1.5rem;
  background-color: var(--color-border, #d1d5db);
}

.phone-input__number {
  flex: 1;
  padding: 0.75rem 1rem 0.75rem 0.75rem;
  border: none;
  outline: none;
  font-size: 1rem;
  background: transparent;
  color: var(--color-text, #1f2937);
  border-radius: 0 0.5rem 0.5rem 0;
}

.phone-input__number::placeholder {
  color: var(--color-text-muted, #9ca3af);
}

.phone-input__number:disabled {
  cursor: not-allowed;
}

.phone-input__error {
  font-size: 0.75rem;
  color: var(--color-danger, #dc2626);
}

/* Dropdown animation */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
