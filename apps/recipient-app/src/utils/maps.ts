/// <reference types="@googlemaps/js-api-loader" />

import { Loader } from '@googlemaps/js-api-loader';

let loaderInstance: Loader | null = null;
let loadPromise: ReturnType<Loader['load']> | null = null;

export function getGoogleMapsLoader(): Loader {
  if (!loaderInstance) {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.warn('VITE_GOOGLE_MAPS_API_KEY is not set. Google Maps features will not work.');
    }
    
    loaderInstance = new Loader({
      apiKey: apiKey || '',
      version: 'weekly',
      libraries: ['places', 'geocoding'],
    });
  }
  
  return loaderInstance;
}

export async function loadGoogleMaps(): ReturnType<Loader['load']> {
  if (loadPromise) {
    return loadPromise;
  }
  
  const loader = getGoogleMapsLoader();
  loadPromise = loader.load();
  
  return loadPromise;
}

export function isGoogleMapsConfigured(): boolean {
  return !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
}
