import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
   ...config,
   name: 'AudioBook',
   slug: 'audiobook-mobile',
   version: '1.0.0',
   orientation: 'portrait',
   userInterfaceStyle: 'automatic',
   splash: {
      resizeMode: 'contain',
      backgroundColor: '#000000',
   },
   assetBundlePatterns: ['**/*'],
   ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.audiobook.mobile',
      jsEngine: 'hermes',
      googleServicesFile: process.env.EXPO_PUBLIC_GOOGLE_SERVICES_IOS || undefined,
      infoPlist: {
         UIBackgroundModes: ['audio'],
      },
   },
   android: {
      adaptiveIcon: {
         backgroundColor: '#000000',
      },
      package: 'com.audiobook.mobile',
      jsEngine: 'hermes',
      googleServicesFile: process.env.EXPO_PUBLIC_GOOGLE_SERVICES_ANDROID || undefined,
      permissions: [
         'android.permission.POST_NOTIFICATIONS',
         'android.permission.FOREGROUND_SERVICE',
         'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK',
         'android.permission.WAKE_LOCK',
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
      './app.plugin.js',
      [
         '@react-native-google-signin/google-signin',
         {
            iosUrlScheme: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.replace(/:/g, '') || '',
         },
      ],
   ],
   scheme: ['audiobook', 'trackplayer'],
   newArchEnabled: true,
   experiments: {
      typedRoutes: true,
   },
});
