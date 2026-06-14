import { ExpoConfig, ConfigContext } from 'expo/config';
import { ENVIRONMENT_BUILD_CONFIG } from './config/appEnvironments';
import { loadEnv } from './config/loadEnv';

const appEnv = loadEnv();
const envConfig = ENVIRONMENT_BUILD_CONFIG[appEnv];

function getGoogleIosUrlScheme(clientId: string): string {
   if (clientId.startsWith('com.googleusercontent.apps.')) {
      return clientId;
   }

   const match = clientId.match(/^([^.]+)\.apps\.googleusercontent\.com$/);
   if (match) {
      return `com.googleusercontent.apps.${match[1]}`;
   }

   throw new Error(
      'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID must be a valid iOS OAuth client ID ' +
         '(e.g. 123456789-abc.apps.googleusercontent.com) or reversed URL scheme ' +
         '(e.g. com.googleusercontent.apps.123456789-abc). ' +
         'Get this from Google Cloud Console → APIs & Services → Credentials → iOS client.',
   );
}

const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();
const googleSignInPlugin: [string, { iosUrlScheme: string }] | null =
   googleIosClientId && googleIosClientId !== 'com.googleusercontent.apps'
      ? [
           '@react-native-google-signin/google-signin',
           { iosUrlScheme: getGoogleIosUrlScheme(googleIosClientId) },
        ]
      : null;

const updatesUrl = process.env.EXPO_PUBLIC_UPDATES_URL?.trim();

export default ({ config }: ConfigContext): ExpoConfig => ({
   ...config,
   name: envConfig.name,
   slug: 'audiobook-mobile',
   version: '1.0.0',
   orientation: 'portrait',
   icon: './assets/icon.png',
   userInterfaceStyle: 'automatic',
   splash: {
      image: './assets/images/srota-launch-logo.png',
      resizeMode: 'contain',
      backgroundColor: '#E8DCC4',
   },
   assetBundlePatterns: ['**/*'],
   runtimeVersion: {
      policy: 'appVersion',
   },
   updates: envConfig.enableUpdates
      ? {
           enabled: true,
           fallbackToCacheTimeout: 0,
           checkAutomatically: 'ON_LOAD',
           ...(updatesUrl ? { url: updatesUrl } : {}),
        }
      : {
           enabled: false,
        },
   ios: {
      supportsTablet: true,
      bundleIdentifier: envConfig.bundleId,
      icon: './assets/icon.png',
      jsEngine: 'hermes',
      googleServicesFile: process.env.EXPO_PUBLIC_GOOGLE_SERVICES_IOS || undefined,
      infoPlist: {
         CFBundleDisplayName: envConfig.name,
         UIBackgroundModes: ['audio'],
         NSLocalNetworkUsageDescription:
            'Srota connects to your audiobook server on your local network to stream chapters.',
         NSBonjourServices: ['_http._tcp'],
         NSLocationWhenInUseUsageDescription:
            'Srota uses your location to personalize your experience and improve our service.',
      },
   },
   android: {
      icon: './assets/icon.png',
      adaptiveIcon: {
         foregroundImage: './assets/adaptive-icon.png',
         backgroundColor: '#E8DCC4',
      },
      package: envConfig.bundleId,
      jsEngine: 'hermes',
      googleServicesFile: process.env.EXPO_PUBLIC_GOOGLE_SERVICES_ANDROID || undefined,
      permissions: [
         'android.permission.POST_NOTIFICATIONS',
         'android.permission.FOREGROUND_SERVICE',
         'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK',
         'android.permission.WAKE_LOCK',
         'android.permission.ACCESS_COARSE_LOCATION',
         'android.permission.ACCESS_FINE_LOCATION',
      ],
   },
   web: {
      bundler: 'metro',
   },
   plugins: [
      'expo-router',
      [
         'expo-notifications',
         {
            color: '#ffffff',
         },
      ],
      'expo-asset',
      'expo-localization',
      'expo-secure-store',
      [
         'expo-location',
         {
            locationWhenInUsePermission:
               'Srota uses your location to personalize your experience and improve our service.',
            isAndroidBackgroundLocationEnabled: false,
         },
      ],
      './app.plugin.js',
      ...(googleSignInPlugin ? [googleSignInPlugin] : []),
   ],
   scheme: ['srota', 'trackplayer'],
   newArchEnabled: true,
   experiments: {
      typedRoutes: true,
   },
   extra: {
      appEnv,
      updateChannel: envConfig.channel,
      enableDebugLogging: envConfig.enableDebugLogging,
      apiUrls: {
         auth: process.env.EXPO_PUBLIC_AUTH_API_URL ?? null,
         main: process.env.EXPO_PUBLIC_API_URL ?? null,
         streaming: process.env.EXPO_PUBLIC_STREAMING_URL ?? null,
      },
   },
});
