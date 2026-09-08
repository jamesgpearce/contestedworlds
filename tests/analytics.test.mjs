import assert from 'node:assert/strict';
import { test } from 'vitest';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
const source = await readFile(
  new URL('../src/lib/analytics.ts', import.meta.url),
  'utf8',
);
const js = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ES2022 },
}).outputText;
const { analyticsEnabled, analyticsCommands } = await import(
  `data:text/javascript;base64,${Buffer.from(js).toString('base64')}`
);
const id = 'G-EYQ3SGDHPC',
  url = 'https://contestedworlds.com/';
test('Analytics only loads on its configured production host and respects privacy signals', () => {
  assert.equal(
    analyticsEnabled(id, url, { hostname: 'contestedworlds.com' }, {}),
    true,
  );
  for (const hostname of ['localhost', '127.0.0.1', '[::1]', 'fork.github.io'])
    assert.equal(analyticsEnabled(id, url, { hostname }, {}), false);
  for (const privacy of [{ doNotTrack: '1' }, { globalPrivacyControl: true }])
    assert.equal(
      analyticsEnabled(id, url, { hostname: 'contestedworlds.com' }, privacy),
      false,
    );
  assert.equal(
    analyticsEnabled('', url, { hostname: 'contestedworlds.com' }, {}),
    false,
  );
  assert.equal(
    analyticsEnabled('off', url, { hostname: 'contestedworlds.com' }, {}),
    false,
  );
});
test('The tag queues one canonical page view and disables advertising features', () => {
  const commands = analyticsCommands(id, url, 'Contested Worlds');
  const config = commands.find(([type]) => type === 'config')[2];
  assert.equal(config.send_page_view, false);
  assert.equal(config.allow_google_signals, false);
  assert.equal(config.allow_ad_personalization_signals, false);
  const visits = commands.filter(
    ([type, name]) => type === 'event' && name === 'page_view',
  );
  assert.equal(visits.length, 1);
  assert.equal(visits[0][2].page_location, url);
  assert.equal(new URL(visits[0][2].page_location).search, '');
});
