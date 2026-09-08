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
    build: { outDir: 'docs', emptyOutDir: true },
    resolve: { alias: { '@': `${process.cwd()}/src` } },
  };
});
