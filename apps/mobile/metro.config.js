const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch the entire monorepo so workspace packages (packages/*) resolve
config.watchFolders = [monorepoRoot];

// Tell Metro where to find node_modules in a pnpm monorepo.
// pnpm hoists shared deps to root node_modules, but each workspace
// package also has its own node_modules with symlinks.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Follow symlinks -- critical for pnpm's content-addressable store
config.resolver.unstable_enableSymlinks = true;

// Ensure Metro resolves package.json "exports" field
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
