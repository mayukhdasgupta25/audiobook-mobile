/**
 * Load environment variables for app.config.ts based on APP_ENV.
 */

import path from 'path';
import dotenv from 'dotenv';
import { isAppEnvironment, type AppEnvironment } from './appEnvironments';

const projectRoot = path.resolve(__dirname, '..');

export function resolveAppEnv(): AppEnvironment {
   const raw = process.env.APP_ENV ?? process.env.EXPO_PUBLIC_APP_ENV ?? 'development';
   if (isAppEnvironment(raw)) {
      return raw;
   }
   return 'development';
}

/** Load `.env.{APP_ENV}`, then `.env.local`, then `.env` overrides. */
export function loadEnv(): AppEnvironment {
   const appEnv = resolveAppEnv();

   dotenv.config({ path: path.join(projectRoot, `.env.${appEnv}`) });
   dotenv.config({ path: path.join(projectRoot, '.env.local'), override: true });
   dotenv.config({ path: path.join(projectRoot, '.env'), override: true });

   process.env.APP_ENV = appEnv;
   process.env.EXPO_PUBLIC_APP_ENV = appEnv;

   return appEnv;
}
