const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'zustand') {
    return {
      type: 'sourceFile',
      filePath: require.resolve(path.join(__dirname, 'node_modules/zustand/index.js')),
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
