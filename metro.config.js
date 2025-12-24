// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { wrapWithReanimatedMetroConfig } = require('react-native-reanimated/metro-config');
const { withTamagui } = require('@tamagui/metro-plugin');
const path = require('node:path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(__dirname, '../..');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot, {
  isCSSEnabled: true,
});

config.watchFolders = [workspaceRoot];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'tslib') {
    return {
      filePath: require.resolve('tslib'),
      type: 'sourceFile',
    };
  }

  // Skip optional wagmi connector peer dependencies that aren't installed
  const optionalWagmiDeps = [
    '@base-org/account',
    '@coinbase/wallet-sdk',
    '@gemini-wallet/core',
    '@safe-global/safe-apps-provider',
    '@safe-global/safe-apps-sdk',
    'porto',
  ];

  if (optionalWagmiDeps.some((dep) => moduleName === dep || moduleName.startsWith(`${dep}/`))) {
    return {
      type: 'empty',
    };
  }

  // Attempt to suppress warnings for @tamagui/lucide-icons deep imports
  if (moduleName.startsWith('@tamagui/lucide-icons/dist/esm/icons/')) {
    return context.resolveRequest(
      { ...context, unstable_enablePackageExports: false },
      moduleName,
      platform
    );
  }

  // Handle .js imports from ox package that should resolve to .ts files
  if (moduleName.endsWith('.js') && context.originModulePath?.includes('node_modules/ox/')) {
    try {
      const tsModuleName = moduleName.replace(/\.js$/, '.ts');
      return context.resolveRequest(context, tsModuleName, platform);
    } catch {}
  }

  return context.resolveRequest(context, moduleName, platform);
};

const reanimatedConfig = wrapWithReanimatedMetroConfig(config);

const withTamaguiConfig = withTamagui(reanimatedConfig, {
  outputCSS: './tamagui-web.css',
  logTimings: false,
  /** needs to match the inverse of whats in apps/expo/index.tsx or we could get errors */
  disableExtraction: process.env.NODE_ENV === 'development',
});

module.exports = withTamaguiConfig;
