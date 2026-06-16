/**
 * Load environment variables for app.config.ts based on APP_ENV.
 * Plain JS so app.config.ts can import it (Expo only transpiles the config file itself).
 */

const path = require('path');
const dotenv = require('dotenv');
const { isAppEnvironment } = require('./appEnvironments');

const projectRoot = path.resolve(__dirname, '..');

function resolveAppEnv() {
   const raw = process.env.APP_ENV ?? process.env.EXPO_PUBLIC_APP_ENV ?? 'development';
   if (isAppEnvironment(raw)) {
      return raw;
   }
   return 'development';
}

/** Load `.env.{APP_ENV}` (overrides Expo's NODE_ENV-based env), then `.env.local`, then `.env`. */
function loadEnv() {
   const appEnv = resolveAppEnv();

   dotenv.config({ path: path.join(projectRoot, `.env.${appEnv}`), override: true });
   dotenv.config({ path: path.join(projectRoot, '.env.local'), override: true });
   dotenv.config({ path: path.join(projectRoot, '.env'), override: true });

   process.env.APP_ENV = appEnv;
   process.env.EXPO_PUBLIC_APP_ENV = appEnv;

   return appEnv;
}

module.exports = {
   resolveAppEnv,
   loadEnv,
};
