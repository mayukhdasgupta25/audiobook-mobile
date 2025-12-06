import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
   ...config,
   name: 'AudioBook',
   slug: 'audiobook-mobile',
   version: '1.0.0',
   orientation: 'portrait',
   // icon: './assets/icon.png', // Uncomment when icon.png is added to assets folder
   userInterfaceStyle: 'automatic',
   splash: {
      // image: './assets/splash.png', // Uncomment when splash.png is added to assets folder
      resizeMode: 'contain',
      backgroundColor: '#000000',
   },
   assetBundlePatterns: ['**/*'],
   ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.audiobook.mobile',
      jsEngine: 'hermes',
      googleServicesFile: process.env.EXPO_PUBLIC_GOOGLE_SERVICES_IOS || undefined,
   },
   android: {
      adaptiveIcon: {
         // foregroundImage: './assets/adaptive-icon.png', // Uncomment when adaptive-icon.png is added
         backgroundColor: '#000000',
      },
      package: 'com.audiobook.mobile',
      jsEngine: 'hermes',
      googleServicesFile: process.env.EXPO_PUBLIC_GOOGLE_SERVICES_ANDROID || undefined,
   },
   web: {
      // favicon: './assets/favicon.png', // Uncomment when favicon.png is added
      bundler: 'metro',
   },
   plugins: [
      'expo-router',
      [
         'expo-notifications',
         {
            // icon: './assets/notification-icon.png', // Uncomment when notification-icon.png is added
            color: '#ffffff',
         },
      ],
      'expo-asset',
      'expo-localization',
      'expo-secure-store',
      'react-native-video',
      './app.plugin.js',
      [
         '@react-native-google-signin/google-signin',
         {
            iosUrlScheme: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.replace(/:/g, '') || '',
         },
      ],
   ],
   scheme: 'audiobook',
   experiments: {
      typedRoutes: true,
   },
});

