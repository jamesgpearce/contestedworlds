import { cp, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';
import { gzipSync } from 'node:zlib';
import { gzipOptions, textAssets } from './assets.mjs';
const root = fileURLToPath(new URL('../docs/', import.meta.url));
const config = JSON.parse(
  await readFile(new URL('../site.config.json', import.meta.url)),
);
const env = loadEnv(
  'production',
  fileURLToPath(new URL('../', import.meta.url)),
  'VITE_',
);
const base = env.VITE_BASE_PATH || '';
const site = new URL(env.VITE_SITE_URL || config.url);
site.search = '';
site.hash = '';
const escape = (value) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('"', '&quot;');
const indexPath = join(root, 'index.html');
const manifest = JSON.parse(await readFile(join(root, '.vite/manifest.json')));
const atlas = manifest['src/render.tsx'];
const preloads = [
  `<link rel="modulepreload" crossorigin href="${base}/${atlas.file}">`,
  ...atlas.css.map(
    (file) => `<link rel="preload" as="style" href="${base}/${file}">`,
  ),
].join('\n');
const index = (await readFile(indexPath, 'utf8'))
  .replaceAll('__BASE_PATH__', base)
  .replaceAll('__SOCIAL_IMAGE__', new URL(`${base}/social-card.png`, site).href)
  .replaceAll('__SITE_URL__', site.href)
  .replace('</head>', `${preloads}\n</head>`);
await writeFile(indexPath, index);
await cp(indexPath, join(root, '404.html'));
await writeFile(join(root, '.nojekyll'), '');
await writeFile(join(root, 'CNAME'), `${new URL(config.url).hostname}\n`);
await writeFile(
  join(root, 'robots.txt'),
  `User-agent: *\nAllow: /\nSitemap: ${new URL('sitemap.xml', site)}\n`,
);
await writeFile(
  join(root, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${escape(site.href)}</loc></url></urlset>\n`,
);
const assets = await textAssets(root);
for (const file of assets)
  await writeFile(
    join(root, `${file}.gz`),
    gzipSync(await readFile(join(root, file)), gzipOptions),
  );
console.log(
  `Generated ${assets.length} gzip assets, including JSON and CSV downloads.`,
);
