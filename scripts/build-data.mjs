import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dataRoot = join(root, 'data');
const outputRoot = join(root, 'public/data');

function requireValue(condition, message) {
  if (!condition) throw new Error(message);
}

async function readJson(name) {
  try {
    const input = await readFile(join(dataRoot, name), 'utf8');
    const value = JSON.parse(input);
    // JSON.parse checks syntax, but silently overwrites duplicate object keys.
    // Consume whole strings so braces and colons inside prose are ignored.
    const objects = [];
    for (const [token] of input.matchAll(/"(?:\\.|[^"\\])*"\s*:?|[{}]/g)) {
      if (token === '{') objects.push(new Set());
      else if (token === '}') objects.pop();
      else if (token.endsWith(':')) {
        const key = JSON.parse(token.slice(0, -1));
        const keys = objects.at(-1);
        if (keys.has(key))
          throw new SyntaxError(`Duplicate key ${JSON.stringify(key)}`);
        keys.add(key);
      }
    }
    return value;
  } catch (error) {
    if (error instanceof SyntaxError)
      throw new Error(`${name}: ${error.message}`);
    throw error;
  }
}

function dateKey(value) {
  requireValue(
    typeof value === 'string' && /^\d{4}(-\d{2}){0,2}$/.test(value),
    `Invalid date: ${value}`,
  );
  const [year, month = 1, day = 1] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  requireValue(
    date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day,
    `Invalid date: ${value}`,
  );
  return date;
}

function record(value, required, context, optional = []) {
  requireValue(
    value !== null && typeof value === 'object' && !Array.isArray(value),
    `${context}: expected an object`,
  );
  const missing = required.filter((key) => !(key in value));
  const allowed = new Set([...required, ...optional]);
  const unknown = Object.keys(value).filter((key) => !allowed.has(key));
  requireValue(!missing.length, `${context}: missing fields ${missing.sort()}`);
  requireValue(
    !unknown.length,
    `${context}: unknown or generated fields ${unknown.sort()}`,
  );
}

function text(value, context) {
  requireValue(
    typeof value === 'string' && value.trim(),
    `${context}: expected nonempty text`,
  );
}

function textFields(value, names, context) {
  for (const name of names) text(value[name], `${context}.${name}`);
}

function identifier(value, context) {
  requireValue(
    typeof value === 'string' && /^[a-z][a-z0-9-]*$/.test(value),
    `${context}: expected a lowercase ID with letters, digits or hyphens`,
  );
}

function strings(value, context) {
  requireValue(
    Array.isArray(value) && value.length,
    `${context}: expected a nonempty list`,
  );
  for (const item of value) text(item, context);
  requireValue(
    new Set(value).size === value.length,
    `${context}: duplicate entry`,
  );
}

function year(value, context) {
  requireValue(
    Number.isInteger(value) && value >= 1000 && value <= 9998,
    `${context}: invalid year`,
  );
}

function records(value, required, context) {
  requireValue(
    Array.isArray(value) && value.length,
    `${context}: expected a nonempty list`,
  );
  const seen = new Set();
  value.forEach((item, index) => {
    const label = `${context}[${index}]`;
    record(item, required, label);
    identifier(item.id, `${label}.id`);
    requireValue(!seen.has(item.id), `${context}: duplicate ID ${item.id}`);
    seen.add(item.id);
  });
}

function csv(value) {
  const textValue = value == null ? '' : String(value);
  return /[",\n\r]/.test(textValue)
    ? `"${textValue.replaceAll('"', '""')}"`
    : textValue;
}

async function compileData() {
  const [meta, owners, sources, contexts, scope] = await Promise.all(
    ['meta', 'owners', 'sources', 'contexts', 'scope'].map((name) =>
      readJson(`${name}.json`),
    ),
  );
  const metaText = [
    'title',
    'version',
    'scope',
    'baseline',
    'method',
    'sovereignty',
    'completeness',
    'sourcePolicy',
    'license',
    'compiled',
    'currentStatusAsOf',
  ];
  record(meta, [...metaText, 'startYear', 'endYear'], 'meta.json');
  textFields(meta, metaText, 'meta.json');
  for (const field of ['compiled', 'currentStatusAsOf']) {
    requireValue(meta[field].length === 10, `meta.${field}: use YYYY-MM-DD`);
    dateKey(meta[field]);
  }
  for (const field of ['startYear', 'endYear'])
    year(meta[field], `meta.${field}`);
  requireValue(
    meta.startYear < meta.endYear,
    'meta: startYear must precede endYear',
  );

  records(owners, ['id', 'label', 'description', 'color'], 'owners.json');
  records(
    sources,
    ['id', 'title', 'publisher', 'type', 'url', 'accessed'],
    'sources.json',
  );
  records(
    contexts,
    ['id', 'start', 'end', 'title', 'description', 'sources'],
    'contexts.json',
  );
  const ownerIds = new Set(owners.map((owner) => owner.id));
  const sourceMap = new Map(sources.map((source) => [source.id, source]));
  for (const source of sources) {
    textFields(
      source,
      ['title', 'publisher', 'type', 'url', 'accessed'],
      source.id,
    );
    const url = new URL(source.url);
    requireValue(
      url.protocol === 'https:' && !url.username && !url.password,
      `${source.id}: source needs an HTTPS URL without credentials`,
    );
    requireValue(
      source.accessed.length === 10,
      `${source.id}: accessed needs YYYY-MM-DD`,
    );
    dateKey(source.accessed);
  }
  for (const owner of owners) {
    textFields(owner, ['label', 'description', 'color'], owner.id);
    requireValue(
      /^#[0-9a-fA-F]{6}$/.test(owner.color),
      `${owner.id}: invalid power colour`,
    );
  }
  const citations = (refs, context) => {
    strings(refs, `${context}.sources`);
    requireValue(
      refs.every((ref) => sourceMap.has(ref)),
      `${context}: unknown source in ${refs}`,
    );
  };
  for (const context of contexts) {
    const label = context.id;
    requireValue(
      !['all', 'custom'].includes(label),
      `${label}: reserved date-preset ID`,
    );
    textFields(context, ['title', 'description'], label);
    citations(context.sources, label);
    year(context.start, `${label}.start`);
    year(context.end, `${label}.end`);
    requireValue(
      meta.startYear <= context.start &&
        context.start < context.end &&
        context.end <= meta.endYear,
      `${label}: era must be within the atlas range`,
    );
  }
  record(scope, ['places', 'tracks'], 'scope.json');
  strings(scope.tracks, 'scope.tracks');
  strings(scope.places, 'scope.places');
  scope.tracks.forEach((name) => identifier(name, 'scope.tracks'));
  const files = new Set(
    (await readdir(join(dataRoot, 'islands')))
      .filter((name) => name.endsWith('.json'))
      .map((name) => name.slice(0, -5)),
  );
  requireValue(
    files.size === scope.tracks.length &&
      scope.tracks.every((track) => files.has(track)),
    'Island files and scope.json tracks do not match',
  );

  const islands = [];
  const allEventIds = new Set();
  const islandKeys = [
    'id',
    'name',
    'place',
    'region',
    'coordinates',
    'peoples',
    'summary',
    'notes',
    'sources',
    'initialController',
    'initialSovereign',
    'events',
  ];
  const eventKeys = [
    'id',
    'date',
    'precision',
    'kind',
    'title',
    'detail',
    'controller',
    'sovereign',
    'sources',
  ];
  const optional = ['uncertainty', 'qualification', 'claimant'];
  const kinds = new Set([
    'claim',
    'context',
    'resistance',
    'status',
    'capture',
    'restoration',
    'settlement',
    'treaty',
    'independence',
    'withdrawal',
    'context-change',
    'resistance-change',
  ]);
  for (const name of scope.tracks) {
    const island = await readJson(`islands/${name}.json`);
    record(island, islandKeys, name);
    requireValue(island.id === name, `${name}: filename and ID differ`);
    textFields(
      island,
      [
        'name',
        'place',
        'region',
        'peoples',
        'summary',
        'notes',
        'initialController',
        'initialSovereign',
      ],
      name,
    );
    requireValue(
      scope.places.includes(island.place),
      `${name}: unknown modern place`,
    );
    const coordinates = island.coordinates;
    requireValue(
      Array.isArray(coordinates) &&
        coordinates.length === 2 &&
        coordinates.every(
          (number) => typeof number === 'number' && Number.isFinite(number),
        ),
      `${name}: coordinates must be two finite numbers [longitude, latitude]`,
    );
    requireValue(
      coordinates[0] >= -89 &&
        coordinates[0] <= -58 &&
        coordinates[1] >= 9 &&
        coordinates[1] <= 29,
      `${name}: coordinates outside atlas bounds`,
    );
    let control = island.initialController;
    let sovereign = island.initialSovereign;
    requireValue(
      ownerIds.has(control) && ownerIds.has(sovereign),
      `${name}: unknown initial power`,
    );
    citations(island.sources, name);
    requireValue(
      Array.isArray(island.events) && island.events.length,
      `${name}: missing events`,
    );
    let previousDate = new Date(Date.UTC(meta.startYear, 0, 1));
    let count = 0;
    island.events.forEach((event, index) => {
      const context = `${name}.events[${index}]`;
      record(event, eventKeys, context, optional);
      identifier(event.id, `${context}.id`);
      requireValue(
        event.id.startsWith(`${name}-`) &&
          event.id.length > name.length + 1 &&
          !allEventIds.has(event.id),
        `Duplicate or invalid event ID: ${event.id}`,
      );
      allEventIds.add(event.id);
      let when;
      try {
        when = dateKey(event.date);
      } catch (error) {
        throw new Error(`${event.id}.date: ${error.message}`);
      }
      requireValue(
        previousDate <= when &&
          when <= new Date(Date.UTC(meta.endYear, 11, 31)),
        `${event.id}: dates must be chronological and within atlas range`,
      );
      previousDate = when;
      const expected = { 4: 'year', 7: 'month', 10: 'day' }[event.date.length];
      requireValue(
        event.precision === expected ||
          (event.precision === 'circa' && expected === 'year'),
        `${event.id}: precision disagrees with date`,
      );
      requireValue(
        typeof event.kind === 'string' && kinds.has(event.kind),
        `${event.id}: unknown event kind`,
      );
      textFields(event, ['title', 'detail'], event.id);
      for (const field of optional)
        if (field in event) text(event[field], `${event.id}.${field}`);
      requireValue(
        event.precision !== 'circa' || event.uncertainty,
        `${event.id}: circa date needs an uncertainty note`,
      );
      for (const field of ['controller', 'sovereign'])
        requireValue(
          event[field] === null ||
            (typeof event[field] === 'string' && ownerIds.has(event[field])),
          `${event.id}.${field}: unknown power`,
        );
      if (['claim', 'context', 'status', 'resistance'].includes(event.kind))
        requireValue(
          event.controller === null && event.sovereign === null,
          `${event.id}: an annotation cannot transfer control or title`,
        );
      if (event.kind === 'claim' || 'claimant' in event)
        requireValue(
          ownerIds.has(event.claimant),
          `${event.id}: a claim needs a known claimant`,
        );
      citations(event.sources, event.id);
      event.year = when.getUTCFullYear();
      event.changesControl =
        event.controller !== null && event.controller !== control;
      event.changesSovereignty =
        event.sovereign !== null && event.sovereign !== sovereign;
      event.previousController = control;
      event.previousSovereign = sovereign;
      control = event.controller || control;
      sovereign = event.sovereign || sovereign;
      event.resultingController = control;
      event.resultingSovereign = sovereign;
      count += Number(event.changesControl);
    });
    island.controlChanges = count;
    island.currentController = control;
    island.currentSovereign = sovereign;
    islands.push(island);
  }
  requireValue(
    new Set(islands.map((island) => island.place)).size ===
      scope.places.length &&
      scope.places.every((place) =>
        islands.some((island) => island.place === place),
      ),
    'A modern place has no track',
  );
  return { meta, owners, sources, contexts, islands };
}

async function writeOutputs(compiled) {
  await rm(outputRoot, { recursive: true, force: true });
  await mkdir(outputRoot, { recursive: true });
  const compact = `${JSON.stringify(compiled)}\n`;
  await writeFile(join(outputRoot, 'caribbean.json'), compact);
  await writeFile(join(root, 'src/lib/caribbean.json'), compact);
  const sourceMap = new Map(
    compiled.sources.map((source) => [source.id, source]),
  );
  const keys = [
    'island',
    'place',
    'event_id',
    'date',
    'precision',
    'kind',
    'title',
    'detail',
    'controller',
    'sovereign',
    'changes_control',
    'changes_sovereignty',
    'uncertainty',
    'qualification',
    'source_ids',
    'source_urls',
  ];
  const eventRows = compiled.islands.flatMap((island) =>
    island.events.map((event) => [
      island.name,
      island.place,
      event.id,
      event.date,
      event.precision,
      event.kind,
      event.title,
      event.detail,
      event.resultingController,
      event.resultingSovereign,
      event.changesControl,
      event.changesSovereignty,
      event.uncertainty || '',
      event.qualification || '',
      event.sources.join('; '),
      event.sources.map((source) => sourceMap.get(source).url).join('; '),
    ]),
  );
  const rows = [keys, ...eventRows.map((row) => row.map(csv).join(','))];
  await writeFile(join(outputRoot, 'events.csv'), `${rows.join('\n')}\n`);
  const notes = compiled.islands.flatMap((island) =>
    island.events
      .filter((event) => event.uncertainty)
      .map((event) => ({
        island: island.name,
        event: event.id,
        date: event.date,
        issue: event.uncertainty,
      })),
  );
  await writeFile(
    join(outputRoot, 'editorial-notes.json'),
    `${JSON.stringify(notes, null, 2)}\n`,
  );
}

try {
  const compiled = await compileData();
  if (!process.argv.includes('--check')) await writeOutputs(compiled);
  console.log(
    `Validated ${compiled.islands.length} tracks, ${compiled.islands.reduce((count, island) => count + island.events.length, 0)} events and ${compiled.sources.length} sources.`,
  );
} catch (error) {
  console.error(`Dataset validation failed: ${error.message}`);
  process.exitCode = 1;
}
