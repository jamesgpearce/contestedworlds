import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const basePath = env.VITE_BASE_PATH || '';
  if (basePath && !/^\/[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/.test(basePath))
    throw new Error(
      'VITE_BASE_PATH must be empty or a path such as /contestedworlds, without a trailing slash.',
    );
  return {
    base: basePath ? `${basePath}/` : '/',
    build: {
      outDir: 'docs',
      emptyOutDir: true,
      assetsInlineLimit: 0,
      manifest: true,
      license: { fileName: 'licenses.txt' },
      // Less raw JS than Terser; gzip is nearly tied. size:compare checks both.
      minify: 'oxc',
      terserOptions: { ecma: 2020, module: true, compress: { passes: 3 } },
    },
    resolve: {
      alias: [
        { find: '@', replacement: `${process.cwd()}/src` },
        // Keep the React component API, with Preact as the browser runtime.
        { find: /^react$/, replacement: 'preact/compat' },
        { find: /^react-dom$/, replacement: 'preact/compat' },
        { find: /^react-dom\/client$/, replacement: 'preact/compat/client' },
        { find: /^react\/jsx-runtime$/, replacement: 'preact/jsx-runtime' },
        {
          find: /^react\/jsx-dev-runtime$/,
          replacement: 'preact/jsx-dev-runtime',
        },
      ],
    },
  };
});
