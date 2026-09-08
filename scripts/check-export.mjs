/** Structural checks of the deployable artifact; no browser or network required. */
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';
import { gunzipSync, gzipSync } from 'node:zlib';
import {
  bootstrapGzipBudget,
  gzipOptions,
  javascriptGzipBudget,
  textAssets,
} from './assets.mjs';
const root = fileURLToPath(new URL('../docs/', import.meta.url));
const html = await readFile(path.join(root, 'index.html'), 'utf8');
const env = loadEnv(
  'production',
  fileURLToPath(new URL('../', import.meta.url)),
  'VITE_',
);
const base = env.VITE_BASE_PATH || '';
const site = new URL(
  env.VITE_SITE_URL ||
    JSON.parse(await readFile(new URL('../site.config.json', import.meta.url)))
      .url,
);
const decode = (s) => s.replaceAll('&amp;', '&');
const paths = new Set(
  [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => decode(m[1])),
);
for (const href of paths) {
  if (/^(?:https?:|data:|#|mailto:)/.test(href)) continue;
  const url = new URL(href, site);
  assert.ok(
    url.pathname.startsWith(`${base}/`),
    `Asset escaped the configured base path: ${href}`,
  );
  const relative =
    decodeURIComponent(url.pathname.slice(base.length)).replace(/^\/+/, '') ||
    'index.html';
  assert.ok(
    (await stat(path.join(root, relative))).isFile(),
    `Missing built asset: ${href}`,
  );
}
const meta = Object.fromEntries(
  [
    ...html.matchAll(
      /<meta\s+(?:property|name)="([^"]+)"\s+content="([^"]*)"/g,
    ),
  ].map((m) => [m[1], decode(m[2])]),
);
for (const key of [
  'og:title',
  'og:description',
  'og:url',
  'og:image',
  'og:image:alt',
  'twitter:card',
  'twitter:image',
])
  assert.ok(meta[key], `Missing ${key}`);
assert.equal(meta['twitter:card'], 'summary_large_image');
assert.equal(meta['og:image'], new URL(`${base}/social-card.png`, site).href);
const canonical = html.match(/rel="canonical" href="([^"]+)"/)?.[1];
assert.equal(
  canonical && new URL(decode(canonical)).href,
  site.href,
  'Canonical URL',
);
assert.ok(
  html.includes('<div id="root">') && html.includes('type="module"'),
  'Static markup must include the Vite client entry',
);
assert.ok(
  html.includes('id="boot-status"') && html.includes('<style>'),
  'First paint needs inline loading markup and CSS',
);
assert.ok(
  !/rel="stylesheet"/.test(html),
  'Full atlas CSS must not block the loading screen',
);
const image = await readFile(path.join(root, 'social-card.png'));
assert.equal(image.readUInt32BE(16), 1200);
assert.equal(image.readUInt32BE(20), 630);
for (const file of [
  '404.html',
  '.nojekyll',
  'robots.txt',
  'sitemap.xml',
  'data/caribbean.json',
  'data/events.csv',
  'apple-touch-icon.png',
  'CNAME',
])
  await stat(path.join(root, file));
assert.equal(
  (await readFile(path.join(root, 'CNAME'), 'utf8')).trim(),
  'contestedworlds.com',
  'Custom domain CNAME',
);
const assets = await textAssets(root);
const manifest = JSON.parse(
  await readFile(path.join(root, '.vite/manifest.json')),
);
const atlas = manifest['src/render.tsx'];
assert.ok(
  html.includes(`rel="modulepreload" crossorigin href="${base}/${atlas.file}"`),
  'Preload the atlas code alongside its data',
);
for (const file of atlas.css)
  assert.ok(
    html.includes(
      `rel="preload" as="style" crossorigin href="${base}/${file}"`,
    ),
    'CSS preload must match the stylesheet request mode to be reused',
  );
for (const name of ['caribbean', 'coastlines']) {
  const file = manifest[`src/lib/${name}.json`].file;
  assert.ok(
    file.startsWith(`assets/${name}-`) && file.endsWith('.json'),
    `${name} must be a hashed external asset`,
  );
  const loaders = await Promise.all(
    manifest['index.html'].imports.map((key) =>
      readFile(path.join(root, manifest[key].file), 'utf8'),
    ),
  );
  assert.ok(
    loaders.some((code) => code.includes(`${base}/${file}`)),
    `${name} must start loading from the bootstrap's static imports`,
  );
  assert.deepEqual(
    JSON.parse(await readFile(path.join(root, file))),
    JSON.parse(
      await readFile(new URL(`../src/lib/${name}.json`, import.meta.url)),
    ),
    `External ${name} dataset differs from its source`,
  );
}
const sizes = [];
for (const file of assets) {
  const original = await readFile(path.join(root, file));
  const compressed = await readFile(path.join(root, `${file}.gz`));
  assert.deepEqual(
    gunzipSync(compressed),
    original,
    `Invalid or stale gzip: ${file}`,
  );
  assert.deepEqual(
    compressed,
    gzipSync(original, gzipOptions),
    `Gzip settings drifted: ${file}`,
  );
  if (file.endsWith('.js'))
    sizes.push({ file, raw: original.length, gzip: compressed.length });
}
assert.ok(sizes.length, 'No JavaScript assets found');
const totalGzip = sizes.reduce((sum, asset) => sum + asset.gzip, 0);
const bootstrap = new Set();
const addStaticImports = (key) => {
  if (bootstrap.has(manifest[key].file)) return;
  bootstrap.add(manifest[key].file);
  for (const dependency of manifest[key].imports || [])
    addStaticImports(dependency);
};
addStaticImports('index.html');
const bootstrapGzip = sizes
  .filter((asset) => bootstrap.has(asset.file))
  .reduce((sum, asset) => sum + asset.gzip, 0);
assert.ok(
  bootstrapGzip < bootstrapGzipBudget,
  `Bootstrap gzip budget exceeded: ${bootstrapGzip} >= ${bootstrapGzipBudget} bytes`,
);
assert.ok(
  totalGzip < javascriptGzipBudget,
  `JavaScript gzip budget exceeded: ${totalGzip} >= ${javascriptGzipBudget} bytes across all chunks`,
);
for (const { file, raw, gzip } of sizes)
  console.log(`${file}: ${raw} bytes raw / ${gzip} bytes gzip`);
console.log(`Bootstrap: ${bootstrapGzip} / ${bootstrapGzipBudget} bytes gzip.`);
console.log(
  `Verified ${assets.length} gzip assets; total JavaScript ${totalGzip} / ${javascriptGzipBudget} bytes gzip.`,
);
console.log(
  `Static export verified: ${paths.size} local/link references, social metadata, image dimensions and downloads (${base || '/'}).`,
);
