/** Rebuild the share card from the same periods, packing and event axis as the atlas. */
import { readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import ts from 'typescript';
const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');
const moduleUrl = (source) =>
  `data:text/javascript;base64,${Buffer.from(
    ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.ES2022,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
  ).toString('base64')}`;
const historyUrl = moduleUrl(
  (await read('../src/lib/history.ts')).replace(
    "import raw from './caribbean.json';",
    `const raw = ${await read('../src/lib/caribbean.json')};`,
  ),
);
const { data, dateValue } = await import(historyUrl);
const { periodsFor, arrangePeriods } = await import(
  moduleUrl(
    (await read('../src/lib/periods.ts')).replace(
      "'./history'",
      JSON.stringify(historyUrl),
    ),
  )
);
const { eventAxis } = await import(
  moduleUrl(await read('../src/lib/event-axis.ts'))
);
const root = new URL('../public/', import.meta.url);
const escape = (text) =>
  String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('"', '&quot;');
const owners = Object.fromEntries(data.owners.map((p) => [p.id, p]));
const tracks = data.islands.filter(
  (island) => island.region === 'Greater Antilles',
);
const range = [data.meta.startYear, dateValue(`${data.meta.endYear}-12-31`)];
const periods = tracks.flatMap((island) =>
  periodsFor(island, 'administration', range),
);
const layout = arrangePeriods(
  periods,
  tracks.map((i) => i.id),
  data.owners.map((p) => p.id),
  1128,
  'powers',
);
const scale = eventAxis(
  range,
  tracks.flatMap((i) =>
    i.events
      .filter((e) => e.changesControl || e.kind === 'claim')
      .map((e) => dateValue(e.date)),
  ),
);
const x = (date) => 250 + scale.position(date) * 866;
const y = (value) => 164 + (value / layout.height) * 411;
const color = (id) =>
  '#' +
  owners[id].color
    .slice(1)
    .match(/../g)
    .map((c) =>
      Math.round(parseInt(c, 16) * 0.7 + 255 * 0.3)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('');
const flags = {
  spain: 'es',
  britain: 'gb',
  france: 'fr',
  usa: 'us',
  haiti: 'ht',
};
const layers = [];
for (const row of layout.rows) {
  layers.push(
    `<rect x="36" y="${y(row.top)}" width="214" height="${y(row.bottom) - y(row.top)}" fill="${color(row.id)}" opacity=".09"/><path d="M36 ${y(row.bottom)}H1152" stroke="#3d4b41"/>`,
  );
  const labelY = row.id === 'indigenous' ? y(row.top) + 14 : y(row.labelY) + 5;
  if (flags[row.id]) {
    const flag = Buffer.from(
      await read(`../public/flags/${flags[row.id]}.svg`),
    ).toString('base64');
    layers.push(
      `<image href="data:image/svg+xml;base64,${flag}" x="45" y="${labelY - 11}" width="20" height="15"/>`,
    );
  } else
    layers.push(
      `<circle cx="55" cy="${labelY - 5}" r="4" fill="none" stroke="${color(row.id)}"/>`,
    );
  layers.push(
    `<text x="76" y="${labelY}" font-size="14" fill="#e3e7de">${escape(row.id === 'indigenous' ? 'Indigenous' : owners[row.id].label)}</text>`,
  );
}
for (const date of scale.labels(866, 105)) {
  layers.push(
    `<text x="${x(date)}" y="178" font-size="12" text-anchor="${date === range[0] ? 'start' : date === range[1] ? 'end' : 'middle'}" fill="#afb9ae">${Math.floor(date)}</text><path d="M${x(date)} 184V575" stroke="#3d4b41" stroke-dasharray="2 5" opacity=".6"/>`,
  );
}
for (const island of tracks) {
  const route = periods.filter((p) => p.islandId === island.id);
  for (let n = 1; n < route.length; n++) {
    const a = route[n - 1],
      b = route[n],
      from = layout.positions[a.id],
      to = layout.positions[b.id];
    const xx = x(b.start),
      y1 = y(from.y + from.height / 2),
      y2 = y(to.y + to.height / 2);
    layers.push(
      `<path d="M${xx - 3} ${y1}C${xx + 3} ${y1} ${xx - 3} ${y2} ${xx + 3} ${y2}" stroke="${color(b.power)}" stroke-width="1" fill="none" opacity=".75"/>`,
    );
  }
}
for (const p of periods) {
  const pos = layout.positions[p.id];
  layers.push(
    `<rect x="${x(p.start)}" y="${y(pos.y)}" width="${Math.max(0, x(p.end) - x(p.start))}" height="${(pos.height / layout.height) * 411}" fill="${color(p.power)}"/>`,
  );
}
for (const p of layout.starting) {
  const pos = layout.positions[p.id];
  layers.push(
    `<text x="240" y="${y(pos.y + pos.height / 2) + 3}" font-size="9" text-anchor="end" fill="#afb9ae">${escape(tracks.find((i) => i.id === p.islandId).name)}</text>`,
  );
}
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<rect width="1200" height="630" fill="#1a211f"/>
<g transform="translate(36 28) scale(1.8)"><path d="M2 2h16v12h-8v16H2Z" fill="#a0b9a4"/><path d="M22 2h8v28H14V18h8Z" fill="#ca9778"/></g>
<g font-family="Helvetica, Arial, sans-serif">
<text x="112" y="78" font-size="56" font-weight="700" letter-spacing="-2.5" fill="#e3e7de">Contested <tspan fill="#a0b9a4">Worlds</tspan></text>
<text x="36" y="118" font-size="23" fill="#afb9ae">The Caribbean through conquest, occupation and independence.</text>
<text x="36" y="158" font-size="16" font-weight="700" fill="#e3e7de">Greater Antilles</text>
${layers.join('')}
<text x="36" y="609" font-size="16" fill="#afb9ae">${data.islands.length} island histories. An open, sourced, interactive atlas.</text>
<text x="1152" y="609" text-anchor="end" font-size="12" fill="#afb9ae">Equal spacing between events</text>
</g></svg>`;
await writeFile(new URL('social-card.svg', root), svg);
await sharp(Buffer.from(svg))
  .png({ compressionLevel: 9 })
  .toFile(new URL('social-card.png', root).pathname);
const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180"><rect width="180" height="180" rx="32" fill="#f2f4ef"/><g transform="translate(26 26) scale(4)"><path d="M2 2h16v12h-8v16H2Z" fill="#668574"/><path d="M22 2h8v28H14V18h8Z" fill="#ab765a"/></g></svg>`;
await sharp(Buffer.from(icon))
  .png()
  .toFile(new URL('apple-touch-icon.png', root).pathname);
console.log(
  'Generated 1200 × 630 Greater Antilles power chart and 180 × 180 touch icon.',
);
