import { ExpoConfig, ConfigContext } from 'expo/config';

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Yadul',
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
    bundleIdentifier: 'com.yadul.app',
    googleServicesFile: './GoogleService-Info.plist',
    infoPlist: {
      CFBundleURLTypes: [
        {
          CFBundleURLSchemes: [
            'app-1-164657838536-ios-fc30db2d9c7bf51c3fe8fd',
          ],
        },
      ],
      UIBackgroundModes: ['remote-notification'],
      LSApplicationQueriesSchemes: ['whatsapp'],
      NSLocationWhenInUseUsageDescription:
        'Allow Yadul to access your location to pin your delivery address on the map.',
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
    package: 'com.yadul.app',
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
        cameraPermission: 'Allow Yadul to access your camera to take guidance photos.',
        photosPermission: 'Allow Yadul to access your photos to add guidance images.',
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'Allow Yadul to access your location to pin your delivery address on the map.',
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
