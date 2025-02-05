const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const {
  wrapWithReanimatedMetroConfig,
} = require('react-native-reanimated/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */

const baseConfig = getDefaultConfig(__dirname);
const customConfig = {};
const mergedConfig = mergeConfig(baseConfig, customConfig);

module.exports = wrapWithReanimatedMetroConfig(mergedConfig);
