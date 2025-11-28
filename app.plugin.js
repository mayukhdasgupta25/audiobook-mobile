const { withInfoPlist, withAppDelegate } = require('@expo/config-plugins');

/**
 * Expo config plugin to ensure MediaSession module is properly configured
 */
const withMediaSession = config => {
  // The module will be auto-discovered by Expo if it's in the ios directory
  // and follows the naming convention
  return config;
};

module.exports = withMediaSession;
