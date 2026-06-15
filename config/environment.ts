/**
 * Runtime environment helpers (read from Expo config extra or EXPO_PUBLIC_APP_ENV).
 */

import Constants from 'expo-constants';
import {
   ENVIRONMENT_BUILD_CONFIG,
   getEnvironmentLabel,
   isAppEnvironment,
   type AppEnvironment,
} from './appEnvironments';

export type { AppEnvironment };

export function getAppEnvironment(): AppEnvironment {
   const fromExtra = Constants.expoConfig?.extra?.appEnv;
   if (isAppEnvironment(fromExtra)) {
      return fromExtra;
   }

   const fromEnv = process.env.EXPO_PUBLIC_APP_ENV;
   if (isAppEnvironment(fromEnv)) {
      return fromEnv;
   }

   return 'development';
}

export function isProduction(): boolean {
   return getAppEnvironment() === 'production';
}

export function isDevelopment(): boolean {
   return getAppEnvironment() === 'development';
}

export function shouldEnableDebugLogging(): boolean {
   const fromExtra = Constants.expoConfig?.extra?.enableDebugLogging;
   if (typeof fromExtra === 'boolean') {
      return fromExtra;
   }
   return ENVIRONMENT_BUILD_CONFIG[getAppEnvironment()].enableDebugLogging;
}

export { getEnvironmentLabel };
