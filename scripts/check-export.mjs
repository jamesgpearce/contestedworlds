/** Structural checks of the deployable artifact; no browser or network required. */
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';
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
  html.includes('<div id="root"></div>') && html.includes('type="module"'),
  'Static markup must include the Vite client entry',
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
console.log(
  `Static export verified: ${paths.size} local/link references, social metadata, image dimensions and downloads (${base || '/'}).`,
);
