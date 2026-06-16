// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

config.transformer = {
   ...config.transformer,
   babelTransformerPath: require.resolve('react-native-svg-transformer/expo'),
};

config.resolver = {
   ...config.resolver,
   assetExts: config.resolver.assetExts.filter((ext) => ext !== 'svg'),
   sourceExts: [...config.resolver.sourceExts, 'svg'],
};

config.server = {
   ...config.server,
   port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
};

module.exports = withNativeWind(config, { input: './global.css' });
