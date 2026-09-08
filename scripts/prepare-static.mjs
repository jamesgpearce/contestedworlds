import { cp, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../docs/', import.meta.url));
const config = JSON.parse(
  await readFile(new URL('../site.config.json', import.meta.url)),
);
const base = process.env.VITE_BASE_PATH || '';
const site = new URL(process.env.VITE_SITE_URL || config.url);
site.search = '';
site.hash = '';
const escape = (value) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('"', '&quot;');
const indexPath = join(root, 'index.html');
const index = (await readFile(indexPath, 'utf8'))
  .replaceAll('__BASE_PATH__', base)
  .replaceAll('__SOCIAL_IMAGE__', new URL(`${base}/social-card.png`, site).href)
  .replaceAll('__SITE_URL__', site.href);
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
