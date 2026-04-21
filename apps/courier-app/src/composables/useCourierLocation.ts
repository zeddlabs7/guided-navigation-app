import { ref } from 'vue';
import type { Coordinates } from '@guidenav/types';

export type CourierLocationStatus =
  | 'idle'
  | 'requesting'
  | 'granted'
  | 'denied'
  | 'unavailable'
  | 'timeout'
  | 'unsupported';

export interface UseCourierLocationOptions {
  enableHighAccuracy?: boolean;
  timeoutMs?: number;
  maximumAgeMs?: number;
}

export function useCourierLocation(options: UseCourierLocationOptions = {}) {
  const {
    enableHighAccuracy = true,
    timeoutMs = 10000,
    maximumAgeMs = 0,
  } = options;

  const coordinates = ref<Coordinates | null>(null);
  const status = ref<CourierLocationStatus>('idle');
  const errorMessage = ref<string | null>(null);

  function requestLocation(): Promise<Coordinates | null> {
    return new Promise((resolve) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        status.value = 'unsupported';
        errorMessage.value = 'Geolocation is not supported by your browser';
        resolve(null);
        return;
      }

      status.value = 'requesting';
      errorMessage.value = null;

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: Coordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          coordinates.value = coords;
          status.value = 'granted';
          resolve(coords);
        },
        (error) => {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              status.value = 'denied';
              errorMessage.value = 'Location permission denied';
              break;
            case error.POSITION_UNAVAILABLE:
              status.value = 'unavailable';
              errorMessage.value = 'Location information is unavailable';
              break;
            case error.TIMEOUT:
              status.value = 'timeout';
              errorMessage.value = 'Location request timed out';
              break;
            default:
              status.value = 'unavailable';
              errorMessage.value = 'Unable to retrieve your location';
          }
          resolve(null);
        },
        {
          enableHighAccuracy,
          timeout: timeoutMs,
          maximumAge: maximumAgeMs,
        }
      );
    });
  }

  function reset() {
    coordinates.value = null;
    status.value = 'idle';
    errorMessage.value = null;
  }

  return {
    coordinates,
    status,
    errorMessage,
    requestLocation,
    reset,
  };
}
