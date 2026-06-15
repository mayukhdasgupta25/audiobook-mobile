/**
 * Runtime types and re-exports for multi-env builds.
 * Implementation lives in appEnvironments.js for Expo app.config compatibility.
 */

import {
   APP_ENVIRONMENTS as APP_ENVIRONMENTS_JS,
   ENVIRONMENT_BUILD_CONFIG as ENVIRONMENT_BUILD_CONFIG_JS,
   getEnvironmentLabel as getEnvironmentLabelJs,
   isAppEnvironment as isAppEnvironmentJs,
} from './appEnvironments.js';

export const APP_ENVIRONMENTS = APP_ENVIRONMENTS_JS as readonly [
   'development',
   'testing',
   'staging',
   'production',
];

export type AppEnvironment = (typeof APP_ENVIRONMENTS)[number];

export interface EnvironmentBuildConfig {
   name: string;
   bundleId: string;
   channel: string;
   enableUpdates: boolean;
   enableDebugLogging: boolean;
}

export const ENVIRONMENT_BUILD_CONFIG =
   ENVIRONMENT_BUILD_CONFIG_JS as Record<AppEnvironment, EnvironmentBuildConfig>;

export function isAppEnvironment(value: string | undefined): value is AppEnvironment {
   return isAppEnvironmentJs(value);
}

export function getEnvironmentLabel(appEnv: AppEnvironment): string {
   return getEnvironmentLabelJs(appEnv);
}
