const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');
const fs = require('fs');

// Ensure all paths are resolved to their physical real paths on Windows
// to avoid drive letter / virtual subst drive mismatch with Metro file map.
const realProjectRoot = fs.realpathSync(__dirname);
const realMonorepoRoot = path.resolve(realProjectRoot, '../..');

/**
 * Metro configuration for monorepo
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  projectRoot: realProjectRoot,
  watchFolders: [
    realMonorepoRoot,
    path.resolve(realMonorepoRoot, 'node_modules'),
    path.resolve(realMonorepoRoot, 'packages/shared-types'),
    path.resolve(realMonorepoRoot, 'packages/trust-algorithm'),
  ],
  resolver: {
    nodeModulesPaths: [
      path.resolve(realProjectRoot, 'node_modules'),
      path.resolve(realMonorepoRoot, 'node_modules'),
    ],
    extraNodeModules: {
      '@wildprice/shared-types': path.resolve(realMonorepoRoot, 'packages/shared-types'),
      '@wildprice/trust-algorithm': path.resolve(realMonorepoRoot, 'packages/trust-algorithm'),
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(realProjectRoot), config);
