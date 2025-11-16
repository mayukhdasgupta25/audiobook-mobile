module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: [
      // expo-router/babel is deprecated in SDK 50+, already included in babel-preset-expo
      'react-native-reanimated/plugin', // Must be last
    ],
  };
};
