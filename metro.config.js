// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Set default port to 3000 (can be overridden by PORT environment variable)
config.server = {
  ...config.server,
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
};

module.exports = withNativeWind(config, { input: './global.css' });
