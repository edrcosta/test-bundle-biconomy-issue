module.exports = (api) => {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          decorators: false,
          unstable_transformImportMeta: true,
          jsxRuntime: 'automatic',
        },
      ],
    ],
    plugins: [
      [
        '@tamagui/babel-plugin',
        {
          exclude: /node_modules/,
          components: ['tamagui'],
          config: './tamagui.config.ts',
          logTimings: false,
          disableExtraction: process.env.NODE_ENV === 'development',
        },
      ],
      '@babel/plugin-transform-class-static-block',
      '@babel/plugin-transform-export-namespace-from',
    ],
  };
};
