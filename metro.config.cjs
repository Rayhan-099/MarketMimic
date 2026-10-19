const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');
const fs = require('node:fs');

const config = getDefaultConfig(__dirname);
config.resolver.sourceExts.push('sql');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Mock Node.js native modules for React Native / Metro bundle
  if (moduleName === 'node:sqlite' || moduleName === 'sqlite') {
    return { type: 'empty' };
  }

  // TypeScript NodeNext emits/uses .js imports for .ts and .tsx files.
  // Resolve .js imports to .tsx, .ts, or directory if the .js file itself does not exist.
  if (moduleName.startsWith('.') && moduleName.endsWith('.js')) {
    const originDir = path.dirname(context.originModulePath);
    const directPath = path.resolve(originDir, moduleName);
    if (!fs.existsSync(directPath)) {
      const candidateBase = moduleName.slice(0, -3);
      for (const ext of ['.tsx', '.ts', '.jsx']) {
        const candidateFile = path.resolve(originDir, candidateBase + ext);
        if (fs.existsSync(candidateFile)) {
          return context.resolveRequest(context, candidateBase, platform);
        }
      }
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
