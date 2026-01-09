// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { wrapWithReanimatedMetroConfig } = require('react-native-reanimated/metro-config');
const { withTamagui } = require('@tamagui/metro-plugin');
const path = require('node:path');
const fs = require('node:fs');
const metroResolver = require('metro-resolver');

const projectRoot = __dirname;

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot, {
  isCSSEnabled: true,
});

// Only watch project root since this is a standalone app (not a monorepo)
config.watchFolders = [projectRoot];
config.resolver.unstable_enablePackageExports = true;

// Force CJS for @biconomy/abstractjs to avoid circular dependency issues with ESM
config.resolver.unstable_conditionNames = ['require', 'default'];

// Preserve the original Metro resolver
const defaultResolveRequest = config.resolver.resolveRequest || metroResolver.resolve;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Force @biconomy/abstractjs to use CJS build to avoid circular dependency issues
  if (moduleName === '@biconomy/abstractjs' || moduleName.startsWith('@biconomy/abstractjs/')) {
    const subpath = moduleName.replace('@biconomy/abstractjs', '');
    const cjsPath = subpath 
      ? path.join(projectRoot, 'node_modules', '@biconomy', 'abstractjs', 'dist', '_cjs', subpath, 'index.js')
      : path.join(projectRoot, 'node_modules', '@biconomy', 'abstractjs', 'dist', '_cjs', 'index.js');
    
    // Check if the file actually exists to prevent Metro errors
    if (fs.existsSync(cjsPath)) {
      return {
        filePath: cjsPath,
        type: 'sourceFile',
      };
    } else {
      console.warn(`File not found at path: ${cjsPath}`);
    }
  }

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
    return defaultResolveRequest(
      { ...context, unstable_enablePackageExports: false },
      moduleName,
      platform
    );
  }

  // Handle .js imports from ox package that should resolve to .ts files
  if (moduleName.endsWith('.js') && context.originModulePath?.includes('node_modules/ox/')) {
    try {
      const tsModuleName = moduleName.replace(/\.js$/, '.ts');
      return defaultResolveRequest(context, tsModuleName, platform);
    } catch {}
  }

  return defaultResolveRequest(context, moduleName, platform);
};

const reanimatedConfig = wrapWithReanimatedMetroConfig(config);

const withTamaguiConfig = withTamagui(reanimatedConfig, {
  outputCSS: './tamagui-web.css',
  logTimings: false,
  /** needs to match the inverse of whats in apps/expo/index.tsx or we could get errors */
  disableExtraction: process.env.NODE_ENV === 'development',
});

module.exports = withTamaguiConfig;
