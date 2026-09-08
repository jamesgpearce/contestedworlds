import { readdir } from 'node:fs/promises';

export const gzipOptions = { level: 9 };
export const javascriptGzipBudget = 100_000;
export const textAssets = async (root) =>
  (await readdir(root, { recursive: true }))
    .filter((file) => /\.(?:js|css|html|json|csv|svg|xml|txt)$/.test(file))
    .sort();
