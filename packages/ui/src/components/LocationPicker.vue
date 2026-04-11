<script setup lang="ts">
import { ref, shallowRef, onMounted, onBeforeUnmount, watch, computed, nextTick } from 'vue';
import type { Coordinates, LocationData } from '@guidenav/types';

interface Props {
  modelValue: LocationData | null;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
  defaultCenter?: Coordinates;
  defaultZoom?: number;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  label: 'Location',
  placeholder: 'Search for an address...',
  defaultCenter: () => ({ latitude: 25.2048, longitude: 55.2708 }), // Dubai as default
  defaultZoom: 15,
});

const emit = defineEmits<{
  'update:modelValue': [value: LocationData | null];
}>();

const mapContainer = ref<HTMLDivElement | null>(null);
const autocompleteContainer = ref<HTMLDivElement | null>(null);
// Use shallowRef for Google Maps objects to prevent Vue's reactivity from wrapping them in proxies
// This is critical - proxied Google Maps objects break marker rendering
// Using 'any' types because Google Maps types are only available at runtime after the API loads
const mapInstance = shallowRef<any>(null);
const markerInstance = shallowRef<any>(null);
const autocompleteElement = shallowRef<any>(null);
const geocoder = shallowRef<any>(null);
const googleRef = shallowRef<any>(null);
const AdvancedMarkerElementClass = shallowRef<any>(null);

const isLoading = ref(true);
const loadError = ref<string | null>(null);
const isMapError = ref(false); // Track if error is map-related (vs geolocation)
const isApiConfigured = ref(false);

const displayAddress = computed(() => {
  return props.modelValue?.formattedAddress || '';
});

// Shadow DOM monkey-patch to style the PlaceAutocompleteElement
function setupShadowDOMStyling() {
  if ((window as unknown as Record<string, unknown>).__gmpShadowPatched) return;
  
  const originalAttachShadow = Element.prototype.attachShadow;
  Element.prototype.attachShadow = function(init: ShadowRootInit) {
    if (this.localName === 'gmp-place-autocomplete') {
      // Force shadow DOM to be open so we can style it
      const shadow = originalAttachShadow.call(this, { ...init, mode: 'open' });
      const style = document.createElement('style');
      style.textContent = `
        /* Style the input container */
        .input-container {
          border: 1px solid #d1d5db !important;
          border-radius: 0.75rem !important;
          background-color: #ffffff !important;
          transition: border-color 0.2s ease, box-shadow 0.2s ease !important;
        }
        
        /* Focus state for the container */
        .input-container:focus-within {
          border-color: #2563eb !important;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1) !important;
        }
        
        /* Style the input */
        input {
          border: none !important;
          outline: none !important;
          background: transparent !important;
          font-size: 1rem !important;
          font-family: inherit !important;
          line-height: 1.5 !important;
          padding: 12px 16px !important;
          padding-left: 40px !important;
          padding-right: 40px !important;
          height: 48px !important;
          box-sizing: border-box !important;
          color: #1f2937 !important;
        }
        
        input::placeholder {
          color: #9ca3af !important;
        }
        
        /* Hide Google's default focus ring */
        .focus-ring {
          display: none !important;
        }
        
        /* Style the search icon */
        .autocomplete-icon {
          position: absolute !important;
          left: 12px !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
          z-index: 1 !important;
          color: #9ca3af !important;
        }
        
        /* Style the clear button */
        .clear-button {
          position: absolute !important;
          right: 12px !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
          z-index: 1 !important;
          background: none !important;
          border: none !important;
          cursor: pointer !important;
          color: #9ca3af !important;
        }
        
        .clear-button:hover {
          color: #6b7280 !important;
        }
      `;
      shadow.appendChild(style);
      return shadow;
    }
    return originalAttachShadow.call(this, init);
  };
  (window as unknown as Record<string, unknown>).__gmpShadowPatched = true;
}

// Update the search input field with an address (for two-way binding)
function updateSearchInput(address: string) {
  if (!autocompleteElement.value) return;
  
  // Access the shadow root (now open due to our monkey-patch)
  const shadow = autocompleteElement.value.shadowRoot;
  if (shadow) {
    const input = shadow.querySelector('input');
    if (input) {
      input.value = address;
    }
  }
}

// Search for an address using the Geocoder (for Enter key handling)
async function searchAddress(address: string) {
  if (!geocoder.value || !address.trim()) return;
  
  try {
    const response = await geocoder.value.geocode({ address: address.trim() });
    
    if (response.results[0]) {
      const result = response.results[0];
      const location = result.geometry.location;
      const lat = location.lat();
      const lng = location.lng();
      
      // Update map
      if (mapInstance.value) {
        mapInstance.value.setCenter({ lat, lng });
        mapInstance.value.setZoom(17);
      }
      
      // Update marker
      updateMarkerPosition({ lat, lng });
      
      // Update the search input with the formatted address
      updateSearchInput(result.formatted_address);
      
      // Emit the value
      emit('update:modelValue', {
        coordinates: { latitude: lat, longitude: lng },
        formattedAddress: result.formatted_address,
        placeId: result.place_id,
      });
    }
  } catch (error) {
    console.error('Address search failed:', error);
  }
}

// Helper to update marker position (works with AdvancedMarkerElement)
function updateMarkerPosition(position: { lat: number; lng: number }) {
  if (markerInstance.value) {
    markerInstance.value.position = position;
  }
}

// Helper to hide marker
function hideMarker() {
  if (markerInstance.value) {
    markerInstance.value.map = null;
  }
}

// Helper to show marker on map
function showMarker() {
  if (markerInstance.value && mapInstance.value) {
    markerInstance.value.map = mapInstance.value;
  }
}

async function initializeMap() {
  if (!mapContainer.value || !autocompleteContainer.value) return;
  
  // Setup Shadow DOM styling BEFORE loading Google Maps
  setupShadowDOMStyling();
  
  try {
    const apiKey = (window as unknown as Record<string, string>).__GOOGLE_MAPS_API_KEY__;
    
    if (!apiKey) {
      loadError.value = 'Google Maps API key is not configured';
      isMapError.value = true;
      isLoading.value = false;
      return;
    }
    
    isApiConfigured.value = true;
    
    const { Loader } = await import('@googlemaps/js-api-loader');
    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places', 'geocoding', 'marker'],
    });
    
    googleRef.value = await loader.load();
    const google = googleRef.value;
    
    // Import libraries
    const { PlaceAutocompleteElement } = await google.maps.importLibrary('places') as any;
    const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary('marker') as any;
    AdvancedMarkerElementClass.value = AdvancedMarkerElement;
    
    // Initialize map with DEMO_MAP_ID for AdvancedMarkerElement support
    const center = props.modelValue?.coordinates 
      ? { lat: props.modelValue.coordinates.latitude, lng: props.modelValue.coordinates.longitude }
      : { lat: props.defaultCenter.latitude, lng: props.defaultCenter.longitude };
    
    mapInstance.value = new google.maps.Map(mapContainer.value, {
      center,
      zoom: props.modelValue ? 17 : props.defaultZoom,
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: 'greedy',
      clickableIcons: false,
      mapId: 'DEMO_MAP_ID', // Google's demo map ID for testing
    });
    
    // Initialize geocoder
    geocoder.value = new google.maps.Geocoder();
    
    // Create a styled pin using Google's PinElement
    const pin = new PinElement({
      background: '#2563eb',
      borderColor: '#1d4ed8',
      glyphColor: '#ffffff',
      scale: 1.2,
    });
    
    // Create AdvancedMarkerElement with the styled pin (use PinElement directly, not .element)
    markerInstance.value = new AdvancedMarkerElement({
      position: props.modelValue?.coordinates 
        ? { lat: props.modelValue.coordinates.latitude, lng: props.modelValue.coordinates.longitude }
        : center,
      map: props.modelValue?.coordinates ? mapInstance.value : null, // Only show if we have initial coordinates
      gmpDraggable: !props.disabled,
      content: pin,
    });
    
    // Handle marker drag
    markerInstance.value.addListener('dragend', async () => {
      const position = markerInstance.value?.position;
      if (position) {
        const lat = typeof position.lat === 'function' ? position.lat() : position.lat;
        const lng = typeof position.lng === 'function' ? position.lng() : position.lng;
        await reverseGeocode({ lat, lng });
      }
    });
    
    // Handle map click
    mapInstance.value.addListener('click', async (e: any) => {
      if (props.disabled || !e.latLng) return;
      
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      
      // Update marker position and show it
      updateMarkerPosition({ lat, lng });
      showMarker();
      
      await reverseGeocode({ lat, lng });
    });
    
    // Initialize PlaceAutocompleteElement
    autocompleteElement.value = new PlaceAutocompleteElement({});
    autocompleteElement.value.id = 'place-autocomplete-input';
    
    // Append to container
    autocompleteContainer.value.appendChild(autocompleteElement.value);
    
    // Add Enter key handler for searching by address
    // We need to wait for the shadow DOM to be ready
    await nextTick();
    setTimeout(() => {
      if (autocompleteElement.value?.shadowRoot) {
        const input = autocompleteElement.value.shadowRoot.querySelector('input');
        if (input) {
          input.addEventListener('keydown', async (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const address = input.value;
              if (address) {
                await searchAddress(address);
              }
            }
          });
        }
      }
    }, 100);
    
    // Handle place selection (when user clicks on a suggestion)
    autocompleteElement.value.addEventListener('gmp-placeselect', async (event: any) => {
      const placeEvent = event as any;
      const place = placeEvent.place;
      
      if (!place) {
        console.error('No place returned from placeselect event');
        return;
      }
      
      try {
        // Fetch place details
        await place.fetchFields({ 
          fields: ['location', 'formattedAddress', 'displayName', 'addressComponents'] 
        });
        
        const location = place.location;
        
        if (!location) {
          console.error('Place has no location data:', place);
          return;
        }
        
        const lat = location.lat();
        const lng = location.lng();
        
        // Update map center and zoom
        if (mapInstance.value) {
          mapInstance.value.setCenter({ lat, lng });
          mapInstance.value.setZoom(17);
        }
        
        // Update marker position and show it
        updateMarkerPosition({ lat, lng });
        showMarker();
        
        // Get the formatted address
        const formattedAddress = place.formattedAddress || place.displayName || '';
        
        // Emit the value
        emit('update:modelValue', {
          coordinates: { latitude: lat, longitude: lng },
          formattedAddress,
          placeId: place.id,
        });
        
      } catch (err) {
        console.error('Error fetching place details:', err);
        
        // Try to use geocoder as fallback
        if (geocoder.value && place.id) {
          try {
            const response = await geocoder.value.geocode({ placeId: place.id });
            if (response.results[0]) {
              const result = response.results[0];
              const location = result.geometry.location;
              const lat = location.lat();
              const lng = location.lng();
              
              // Update map
              if (mapInstance.value) {
                mapInstance.value.setCenter({ lat, lng });
                mapInstance.value.setZoom(17);
              }
              
              // Update marker
              updateMarkerPosition({ lat, lng });
              showMarker();
              
              // Emit the value
              emit('update:modelValue', {
                coordinates: { latitude: lat, longitude: lng },
                formattedAddress: result.formatted_address,
                placeId: place.id,
              });
            }
          } catch (geocodeErr) {
            console.error('Geocode fallback also failed:', geocodeErr);
          }
        }
      }
    });
    
    isLoading.value = false;
  } catch (error) {
    console.error('Failed to load Google Maps:', error);
    loadError.value = 'Failed to load Google Maps';
    isMapError.value = true;
    isLoading.value = false;
  }
}

async function reverseGeocode(position: { lat: number; lng: number }) {
  if (!geocoder.value) return;
  
  try {
    const response = await geocoder.value.geocode({ location: position });
    
    if (response.results[0]) {
      const result = response.results[0];
      const address = result.formatted_address;
      
      // Update the search input field (two-way binding)
      updateSearchInput(address);
      
      emit('update:modelValue', {
        coordinates: { latitude: position.lat, longitude: position.lng },
        formattedAddress: address,
        placeId: result.place_id,
      });
    } else {
      const coordsString = `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`;
      
      // Update the search input field (two-way binding)
      updateSearchInput(coordsString);
      
      emit('update:modelValue', {
        coordinates: { latitude: position.lat, longitude: position.lng },
        formattedAddress: coordsString,
      });
    }
  } catch (error) {
    console.error('Geocoding failed:', error);
    const coordsString = `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`;
    
    // Update the search input field (two-way binding)
    updateSearchInput(coordsString);
    
    emit('update:modelValue', {
      coordinates: { latitude: position.lat, longitude: position.lng },
      formattedAddress: coordsString,
    });
  }
}

function handleClear() {
  emit('update:modelValue', null);
  
  // Clear the search input field
  updateSearchInput('');
  
  // Hide the marker
  hideMarker();
  
  if (mapInstance.value) {
    mapInstance.value.setCenter({ 
      lat: props.defaultCenter.latitude, 
      lng: props.defaultCenter.longitude 
    });
    mapInstance.value.setZoom(props.defaultZoom);
  }
}

function handleUseCurrentLocation() {
  if (!navigator.geolocation) {
    loadError.value = 'Geolocation is not supported by your browser';
    isMapError.value = false;
    setTimeout(() => { loadError.value = null; }, 5000);
    return;
  }
  
  isLoading.value = true;
  
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      
      if (mapInstance.value) {
        mapInstance.value.setCenter({ lat, lng });
        mapInstance.value.setZoom(17);
        updateMarkerPosition({ lat, lng });
        showMarker();
        await reverseGeocode({ lat, lng });
      }
      
      isLoading.value = false;
    },
    (error) => {
      console.error('Geolocation error:', error);
      
      // Provide specific error messages based on the error code
      let message = 'Unable to get your location';
      switch (error.code) {
        case error.PERMISSION_DENIED:
          message = 'Location permission denied. Please allow location access in your browser settings.';
          break;
        case error.POSITION_UNAVAILABLE:
          message = 'Location information is unavailable. Please try again.';
          break;
        case error.TIMEOUT:
          message = 'Location request timed out. Please try again.';
          break;
      }
      
      loadError.value = message;
      isMapError.value = false; // This is a geolocation error, not a map API error
      isLoading.value = false;
      setTimeout(() => { loadError.value = null; }, 5000);
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

watch(() => props.modelValue, (newValue) => {
  if (newValue && mapInstance.value) {
    const position = { 
      lat: newValue.coordinates.latitude, 
      lng: newValue.coordinates.longitude 
    };
    mapInstance.value.setCenter(position);
    updateMarkerPosition(position);
    showMarker();
  }
}, { deep: true });

watch(() => props.disabled, (disabled) => {
  if (markerInstance.value) {
    markerInstance.value.gmpDraggable = !disabled;
  }
});

onMounted(() => {
  initializeMap();
});

onBeforeUnmount(() => {
  if (autocompleteElement.value) {
    autocompleteElement.value.remove();
  }
  if (mapInstance.value && googleRef.value) {
    googleRef.value.maps.event.clearInstanceListeners(mapInstance.value);
  }
  if (markerInstance.value) {
    // AdvancedMarkerElement doesn't use the same event system
    markerInstance.value.map = null;
  }
});

defineExpose({
  setApiKey: (key: string) => {
    (window as unknown as Record<string, string>).__GOOGLE_MAPS_API_KEY__ = key;
  },
});
</script>

<template>
  <div class="location-picker">
    <label v-if="label" class="location-picker__label">{{ label }}</label>
    
    <!-- Search Input -->
    <div class="location-picker__search">
      <div 
        ref="autocompleteContainer"
        class="location-picker__autocomplete-container"
        :class="{ 'location-picker__autocomplete-container--disabled': disabled || isLoading || !isApiConfigured }"
      >
        <!-- PlaceAutocompleteElement will be inserted here -->
      </div>
      
      <button
        type="button"
        class="location-picker__location-btn"
        :disabled="disabled || isLoading || !isApiConfigured"
        @click="handleUseCurrentLocation"
        title="Use current location"
      >
        <svg 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
          <path d="M12 2V4M12 20V22M2 12H4M20 12H22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="2"/>
        </svg>
      </button>
    </div>
    
    <!-- Map Container -->
    <div class="location-picker__map-wrapper">
      <div 
        ref="mapContainer" 
        class="location-picker__map"
        :class="{ 'location-picker__map--disabled': disabled }"
      />
      
      <!-- Loading Overlay -->
      <div v-if="isLoading" class="location-picker__loading">
        <div class="location-picker__spinner" />
        <span>Loading map...</span>
      </div>
      
      <!-- Error State -->
      <div v-else-if="loadError" class="location-picker__error">
        <svg 
          width="32" 
          height="32" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
          <path d="M12 7V13M12 16V17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <span>{{ loadError }}</span>
        <!-- Only show API key hint for map-related errors, not geolocation errors -->
        <p v-if="isMapError" class="location-picker__error-hint">
          Please ensure VITE_GOOGLE_MAPS_API_KEY is configured in your environment.
        </p>
      </div>
      
      <!-- Map Instruction -->
      <div v-if="!isLoading && !loadError && !modelValue" class="location-picker__hint">
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 5.03 7.03 1 12 1C16.97 1 21 5.03 21 10Z" stroke="currentColor" stroke-width="2"/>
          <circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="2"/>
        </svg>
        <span>Search for an address or tap on the map to drop a pin</span>
      </div>
    </div>
    
    <!-- Selected Location Display -->
    <div v-if="modelValue" class="location-picker__selected">
      <div class="location-picker__selected-info">
        <svg 
          class="location-picker__selected-icon"
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 5.03 7.03 1 12 1C16.97 1 21 5.03 21 10Z" stroke="currentColor" stroke-width="2"/>
          <circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="2"/>
        </svg>
        <div class="location-picker__selected-text">
          <span class="location-picker__selected-address">{{ displayAddress }}</span>
          <span class="location-picker__selected-coords">
            {{ modelValue.coordinates.latitude.toFixed(6) }}, {{ modelValue.coordinates.longitude.toFixed(6) }}
          </span>
        </div>
      </div>
      
      <button
        type="button"
        class="location-picker__clear-btn"
        :disabled="disabled"
        @click="handleClear"
      >
        <svg 
          width="18" 
          height="18" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.location-picker {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.location-picker__label {
  font-size: var(--font-size-sm, 0.875rem);
  font-weight: var(--font-weight-medium, 500);
  color: var(--color-text-secondary, #6b7280);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.location-picker__search {
  display: flex;
  gap: 8px;
}

.location-picker__autocomplete-container {
  flex: 1;
  min-width: 0;
  background: transparent !important;
}

.location-picker__autocomplete-container--disabled {
  opacity: 0.6;
  pointer-events: none;
}

/* Style the Google Places Autocomplete Element */
.location-picker__autocomplete-container :deep(gmp-place-autocomplete) {
  width: 100%;
  display: block;
  border: none !important;
  background: transparent !important;
}

.location-picker__autocomplete-container :deep(input) {
  width: 100%;
  height: 48px;
  padding: 12px 16px;
  background-color: var(--color-surface, #ffffff);
  border: 1px solid var(--color-border, #d1d5db);
  border-radius: var(--radius-lg, 0.75rem);
  font-size: var(--font-size-base, 1rem);
  color: var(--color-text, #1f2937);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  box-sizing: border-box;
}

.location-picker__autocomplete-container :deep(input:focus) {
  outline: none;
  border-color: var(--color-primary, #2563eb);
  box-shadow: 0 0 0 3px var(--color-primary-light, rgba(37, 99, 235, 0.1));
}

.location-picker__autocomplete-container :deep(input::placeholder) {
  color: var(--color-text-light, #9ca3af);
}

.location-picker__location-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background-color: var(--color-surface, #ffffff);
  border: 1px solid var(--color-border, #d1d5db);
  border-radius: var(--radius-lg, 0.75rem);
  color: var(--color-text-secondary, #6b7280);
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.location-picker__location-btn:hover:not(:disabled) {
  border-color: var(--color-primary, #2563eb);
  color: var(--color-primary, #2563eb);
}

.location-picker__location-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.location-picker__map-wrapper {
  position: relative;
  border-radius: var(--radius-lg, 0.75rem);
  overflow: hidden;
  border: 1px solid var(--color-border, #d1d5db);
}

.location-picker__map {
  width: 100%;
  height: 280px;
  background-color: var(--color-background, #f9fafb);
}

.location-picker__map--disabled {
  pointer-events: none;
  opacity: 0.7;
}

.location-picker__loading,
.location-picker__error {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background-color: var(--color-background, #f9fafb);
  color: var(--color-text-muted, #9ca3af);
  font-size: var(--font-size-sm, 0.875rem);
}

.location-picker__error {
  color: var(--color-danger, #dc2626);
}

.location-picker__error-hint {
  margin: 0;
  font-size: var(--font-size-xs, 0.75rem);
  color: var(--color-text-muted, #9ca3af);
  text-align: center;
  max-width: 280px;
}

.location-picker__spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-border, #d1d5db);
  border-top-color: var(--color-primary, #2563eb);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.location-picker__hint {
  position: absolute;
  bottom: 12px;
  left: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: var(--radius-md, 0.5rem);
  box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
  font-size: var(--font-size-sm, 0.875rem);
  color: var(--color-text-secondary, #6b7280);
}

.location-picker__hint svg {
  flex-shrink: 0;
  color: var(--color-primary, #2563eb);
}

.location-picker__selected {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  background-color: var(--color-primary-bg, #eff6ff);
  border: 1px solid var(--color-primary-light, rgba(37, 99, 235, 0.2));
  border-radius: var(--radius-lg, 0.75rem);
}

.location-picker__selected-info {
  display: flex;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.location-picker__selected-icon {
  flex-shrink: 0;
  color: var(--color-primary, #2563eb);
  margin-top: 2px;
}

.location-picker__selected-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.location-picker__selected-address {
  font-size: var(--font-size-sm, 0.875rem);
  font-weight: var(--font-weight-medium, 500);
  color: var(--color-text, #1f2937);
  word-break: break-word;
}

.location-picker__selected-coords {
  font-size: var(--font-size-xs, 0.75rem);
  color: var(--color-text-muted, #9ca3af);
  font-family: monospace;
}

.location-picker__clear-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: none;
  border: none;
  border-radius: var(--radius-sm, 0.25rem);
  color: var(--color-text-muted, #9ca3af);
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.location-picker__clear-btn:hover:not(:disabled) {
  background-color: rgba(0, 0, 0, 0.05);
  color: var(--color-danger, #dc2626);
}

.location-picker__clear-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
