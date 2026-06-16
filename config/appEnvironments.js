/**
 * Build-time and runtime environment definitions for multi-env builds.
 * Plain JS so app.config.ts can import it (Expo only transpiles the config file itself).
 */

const APP_ENVIRONMENTS = ['development', 'testing', 'staging', 'production'];

const ENVIRONMENT_BUILD_CONFIG = {
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

function isAppEnvironment(value) {
   return APP_ENVIRONMENTS.includes(value);
}

function getEnvironmentLabel(appEnv) {
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

module.exports = {
   APP_ENVIRONMENTS,
   ENVIRONMENT_BUILD_CONFIG,
   isAppEnvironment,
   getEnvironmentLabel,
};
