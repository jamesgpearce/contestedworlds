import { data, islands, stateAt, type Mode } from './history';

type Selection = { islandId: string; year: number; mode: Mode };
type Tool = {
  name: string;
  title: string;
  description: string;
  inputSchema: object;
  annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
  execute: (input: unknown) => unknown;
};
type Context = {
  registerTool: (
    tool: Tool,
    options: { signal: AbortSignal },
  ) => void | Promise<void>;
};

function object(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new Error('Expected an object.');
  return input as Record<string, unknown>;
}

export function atlasTools(navigate: (selection: Selection) => void): Tool[] {
  return [
    {
      name: 'explore_caribbean_island',
      title: 'Explore an island in the atlas',
      description:
        'Update the visible atlas to an island, year and political-power view. This selects the island and clears filters; it never edits historical data.',
      inputSchema: {
        type: 'object',
        properties: {
          islandId: { type: 'string', enum: islands.map((i) => i.id) },
          year: {
            type: 'integer',
            minimum: data.meta.startYear,
            maximum: data.meta.endYear,
          },
          mode: { type: 'string', enum: ['administration', 'sovereignty'] },
        },
        required: ['islandId', 'year', 'mode'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        const value = object(input);
        const island = islands.find((i) => i.id === value.islandId);
        if (
          !island ||
          typeof value.year !== 'number' ||
          !Number.isInteger(value.year) ||
          value.year < data.meta.startYear ||
          value.year > data.meta.endYear ||
          !['administration', 'sovereignty'].includes(String(value.mode)) ||
          Object.keys(value).some(
            (k) => !['islandId', 'year', 'mode'].includes(k),
          )
        )
          throw new Error(
            'Use a valid islandId, an in-range integer year, and administration or sovereignty.',
          );
        const selection = {
          islandId: island.id,
          year: value.year,
          mode: value.mode as Mode,
        };
        navigate(selection);
        return {
          ...selection,
          island: island.name,
          power: stateAt(island, selection.year, selection.mode),
        };
      },
    },
    {
      name: 'read_caribbean_histories',
      title: 'Read cited island histories',
      description:
        'Read the dated histories and evidence for up to ten islands without changing the visible atlas.',
      inputSchema: {
        type: 'object',
        properties: {
          islandIds: {
            type: 'array',
            items: { type: 'string', enum: islands.map((i) => i.id) },
            minItems: 1,
            maxItems: 10,
            uniqueItems: true,
          },
        },
        required: ['islandIds'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute(input) {
        const value = object(input),
          ids = value.islandIds;
        if (
          Object.keys(value).some((k) => k !== 'islandIds') ||
          !Array.isArray(ids) ||
          ids.length < 1 ||
          ids.length > 10 ||
          new Set(ids).size !== ids.length ||
          ids.some((id) => !islands.some((i) => i.id === id))
        )
          throw new Error('Provide one to ten unique valid islandIds.');
        const result = islands.filter((i) => ids.includes(i.id));
        const refs = new Set(
          result.flatMap((i) => [
            ...i.sources,
            ...i.events.flatMap((e) => e.sources),
          ]),
        );
        return {
          islands: result,
          sources: data.sources.filter((s) => refs.has(s.id)),
          method: data.meta.method,
        };
      },
    },
  ];
}

export function registerAtlasTools(navigate: (selection: Selection) => void) {
  const context = (document as Document & { modelContext?: Context })
    .modelContext;
  if (!context?.registerTool) return;
  const lifecycle = new AbortController();
  for (const tool of atlasTools(navigate)) {
    try {
      void Promise.resolve(
        context.registerTool(tool, { signal: lifecycle.signal }),
      ).catch(() => {});
    } catch {
      /* Unsupported registry must not affect the atlas. */
    }
  }
  return () => lifecycle.abort();
}
