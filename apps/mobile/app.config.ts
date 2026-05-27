import { ExpoConfig, ConfigContext } from 'expo/config';

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Arriveo',
  slug: 'arriveo',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'arriveo',
  userInterfaceStyle: 'light',
  newArchEnabled: true,
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.arriveo.app',
    googleServicesFile: './GoogleService-Info.plist',
    infoPlist: {
      CFBundleURLTypes: [
        {
          CFBundleURLSchemes: [
            'app-1-407314189352-ios-98b0ab07a079a2e944791d',
            'com.googleusercontent.apps.407314189352-3shohcr36rqvmpq29p7aqcfojpn5mjas',
          ],
        },
      ],
      UIBackgroundModes: ['remote-notification'],
      LSApplicationQueriesSchemes: ['whatsapp'],
      NSLocationWhenInUseUsageDescription:
        'Allow Arriveo to access your location to pin your delivery address on the map.',
    },
    entitlements: {
      'aps-environment': 'production',
    },
  },
  android: {
    edgeToEdgeEnabled: true,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    package: 'com.arriveo.app',
    googleServicesFile: './google-services.json',
    config: {
      googleMaps: {
        apiKey: GOOGLE_MAPS_API_KEY,
      },
    },
    permissions: [
      'ACCESS_FINE_LOCATION',
      'ACCESS_COARSE_LOCATION',
    ],
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    './plugins/withCoreLibraryDesugaring',
    './plugins/withWhatsAppQueries',
    [
      'expo-build-properties',
      {
        ios: {
          useFrameworks: 'static',
          deploymentTarget: '15.1',
          forceStaticLinking: ['RNFBApp', 'RNFBAuth', 'RNFBFirestore'],
        },
        android: {},
      },
    ],
    '@react-native-firebase/app',
    '@react-native-firebase/auth',
    '@react-native-community/datetimepicker',
    [
      'expo-image-picker',
      {
        cameraPermission: 'Allow Arriveo to access your camera to take guidance photos.',
        photosPermission: 'Allow Arriveo to access your photos to add guidance images.',
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'Allow Arriveo to access your location to pin your delivery address on the map.',
      },
    ],
  ],
  extra: {
    eas: {
      projectId: '68767fae-c3e1-467d-b66e-d6180e281380',
    },
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  },
  experiments: {
    typedRoutes: true,
  },
});
