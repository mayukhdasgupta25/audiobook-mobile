import { ExpoConfig, ConfigContext } from 'expo/config';

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
      ...(googleSignInPlugin ? [googleSignInPlugin] : []),
   ],
   scheme: ['audiobook', 'trackplayer'],
   newArchEnabled: true,
   experiments: {
      typedRoutes: true,
   },
});
