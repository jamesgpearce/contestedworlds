import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  copyFile,
  cp,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'vitest';

async function checkData(name, edit) {
  const root = await mkdtemp(join(tmpdir(), 'contested-data-test-'));
  try {
    await cp(new URL('../data/', import.meta.url), join(root, 'data'), {
      recursive: true,
    });
    await mkdir(join(root, 'scripts'));
    const script = join(root, 'scripts/build-data.mjs');
    await copyFile(
      new URL('../scripts/build-data.mjs', import.meta.url),
      script,
    );
    const file = join(root, 'data', name);
    await writeFile(file, edit(await readFile(file, 'utf8')));
    return spawnSync(process.execPath, [script, '--check'], {
      encoding: 'utf8',
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test('accepts contributor data with repeated keys in separate objects and JSON-like prose', async () => {
  const result = await checkData('meta.json', (input) => {
    const meta = JSON.parse(input);
    meta.title = 'Quotes: "title": {}, backslash \\, and [arrays]';
    return JSON.stringify(meta);
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Validated \d+ tracks, \d+ events/);
});

test.each([
  ['1627', 'year'],
  ['1627-02', 'month'],
  ['1628-02-29', 'day'],
])('accepts valid event date %s', async (date, precision) => {
  const result = await checkData('islands/barbados.json', (input) => {
    const island = JSON.parse(input);
    Object.assign(
      island.events.find((event) => event.id === 'barbados-03'),
      {
        date,
        precision,
      },
    );
    return JSON.stringify(island);
  });
  assert.equal(result.status, 0, result.stderr);
});

test.each([
  '1627-00',
  '1627-00-01',
  '1627-01-00',
  '1627-00-00',
  '1627-02-29',
  '1627-04-31',
])('rejects invalid event date %s', async (date) => {
  const result = await checkData('islands/barbados.json', (input) =>
    input.replace('1627-02-17', date),
  );
  assert.equal(result.status, 1);
  assert.ok(result.stderr.includes(`barbados-03.date: Invalid date: ${date}`));
});

test.each([
  ['meta.json', 'title'],
  ['meta.json', 't\\u0069tle'],
  ['islands/barbados.json', 'title'],
  ['islands/barbados.json', 't\\u0069tle'],
])('rejects duplicate %s key %s', async (name, key) => {
  const result = await checkData(name, (input) =>
    input.replace('"title":', `"${key}" : "overwritten", "title":`),
  );
  assert.equal(result.status, 1);
  assert.ok(result.stderr.includes(`${name}: Duplicate key "title"`));
});

test('still rejects malformed JSON with the contributor filename', async () => {
  const result = await checkData('meta.json', (input) => `${input}}`);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Dataset validation failed: meta\.json:/);
});
