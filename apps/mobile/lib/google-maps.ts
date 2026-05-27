import Constants from 'expo-constants';

/**
 * Resolves the Google Maps API key from Metro env or app.config extra (baked at build time).
 * For EAS builds, set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY as a project secret.
 */
export function getGoogleMapsApiKey(): string {
  const fromEnv = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (fromEnv) return fromEnv;

  const fromExtra = Constants.expoConfig?.extra?.googleMapsApiKey;
  if (typeof fromExtra === 'string' && fromExtra.length > 0) {
    return fromExtra;
  }

  return '';
}

export function isGoogleMapsConfigured(): boolean {
  return getGoogleMapsApiKey().length > 0;
}
