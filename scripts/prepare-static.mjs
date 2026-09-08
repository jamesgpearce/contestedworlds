import {
  cp,
  mkdtemp,
  readFile,
  rename,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../dist/client/', import.meta.url));
const base = process.env.NEXT_PUBLIC_BASE_PATH || '';
// Vinext exports a base path as a directory. Pages mounts the artifact at that
// path itself, so upload the directory's contents, without a second nesting.
if (base) {
  if (!/^\/[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/.test(base))
    throw new Error('Invalid base path');
  const source = join(root, base.slice(1));
  await stat(join(source, 'index.html'));
  const prepared = await mkdtemp(join(dirname(root), 'pages-'));
  await cp(source, prepared, { recursive: true });
  await cp(join(root, '404.html'), join(prepared, '404.html'));
  await rm(root, { recursive: true });
  await rename(prepared, root);
}
const config = JSON.parse(
  await readFile(new URL('../site.config.json', import.meta.url)),
);
const site = new URL(process.env.NEXT_PUBLIC_SITE_URL || config.url);
site.search = '';
site.hash = '';
const escape = (value) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('"', '&quot;');
await writeFile(join(root, '.nojekyll'), '');
await writeFile(
  join(root, 'robots.txt'),
  `User-agent: *\nAllow: /\nSitemap: ${new URL('sitemap.xml', site)}\n`,
);
await writeFile(
  join(root, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${escape(site.href)}</loc></url></urlset>\n`,
);
