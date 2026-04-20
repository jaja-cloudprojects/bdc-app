// For Expo SDK 54+, Reanimated plugin is auto-configured by babel-preset-expo.
// Do NOT add 'react-native-reanimated/plugin' or 'react-native-worklets/plugin' manually.
// See: https://expo.dev/changelog/sdk-54
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
