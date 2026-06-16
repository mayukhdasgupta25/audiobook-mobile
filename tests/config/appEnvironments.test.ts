import {
   APP_ENVIRONMENTS,
   ENVIRONMENT_BUILD_CONFIG,
   getEnvironmentLabel,
   isAppEnvironment,
} from '@/config/appEnvironments';

describe('appEnvironments', () => {
   it('defines four environments with distinct bundle IDs', () => {
      expect(APP_ENVIRONMENTS).toEqual([
         'development',
         'testing',
         'staging',
         'production',
      ]);

      const bundleIds = APP_ENVIRONMENTS.map((env) => ENVIRONMENT_BUILD_CONFIG[env].bundleId);
      expect(new Set(bundleIds).size).toBe(4);
      expect(ENVIRONMENT_BUILD_CONFIG.production.bundleId).toBe('com.srota.mobile');
      expect(ENVIRONMENT_BUILD_CONFIG.development.bundleId).toBe('com.srota.mobile.dev');
   });

   it('validates environment names', () => {
      expect(isAppEnvironment('staging')).toBe(true);
      expect(isAppEnvironment('invalid')).toBe(false);
   });

   it('returns display labels for non-production builds', () => {
      expect(getEnvironmentLabel('development')).toBe('DEV');
      expect(getEnvironmentLabel('staging')).toBe('STAGING');
      expect(getEnvironmentLabel('production')).toBe('PROD');
   });
});
