/**
 * Build-time and runtime environment definitions for multi-env builds.
 */

export const APP_ENVIRONMENTS = [
   'development',
   'testing',
   'staging',
   'production',
] as const;

export type AppEnvironment = (typeof APP_ENVIRONMENTS)[number];

export interface EnvironmentBuildConfig {
   name: string;
   bundleId: string;
   channel: string;
   enableUpdates: boolean;
   enableDebugLogging: boolean;
}

export const ENVIRONMENT_BUILD_CONFIG: Record<AppEnvironment, EnvironmentBuildConfig> = {
   development: {
      name: 'Srota Dev',
      bundleId: 'com.srota.mobile.dev',
      channel: 'development',
      enableUpdates: false,
      enableDebugLogging: true,
   },
   testing: {
      name: 'Srota Test',
      bundleId: 'com.srota.mobile.test',
      channel: 'testing',
      enableUpdates: true,
      enableDebugLogging: true,
   },
   staging: {
      name: 'Srota Staging',
      bundleId: 'com.srota.mobile.staging',
      channel: 'staging',
      enableUpdates: true,
      enableDebugLogging: true,
   },
   production: {
      name: 'Srota',
      bundleId: 'com.srota.mobile',
      channel: 'production',
      enableUpdates: true,
      enableDebugLogging: false,
   },
};

export function isAppEnvironment(value: string | undefined): value is AppEnvironment {
   return APP_ENVIRONMENTS.includes(value as AppEnvironment);
}

export function getEnvironmentLabel(appEnv: AppEnvironment): string {
   switch (appEnv) {
      case 'development':
         return 'DEV';
      case 'testing':
         return 'TEST';
      case 'staging':
         return 'STAGING';
      case 'production':
         return 'PROD';
   }
}
