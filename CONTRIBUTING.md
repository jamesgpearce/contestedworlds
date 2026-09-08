# Contributing to Contested Worlds

Historical corrections are the most valuable contributions. A data-only PR needs no React, SVG or CSS knowledge. If you have evidence but are unsure how to edit the dataset, [open a historical correction issue](https://github.com/jamesgpearce/contestedworlds/issues/new/choose).

## Make a correction in your browser

1. Find the island in [data/islands/](data/islands/) and use GitHub's **Edit** button. GitHub can create your fork and proposed change.
2. Correct the record using your own explanatory prose. **Keep its existing `id`**, even when the date changes and the record moves in the sequence: shared links use that ID.
3. Include source IDs from [data/sources.json](data/sources.json), or add a source there. Identify the relevant page, passage or archival reference in the PR description.
4. Keep events in chronological order and retain uncertainty. Explain whether the event affected the whole island, one settlement or a broader group.
5. Propose a pull request. GitHub Actions checks the dataset and the site. A maintainer reviews the historical interpretation.

No local installation is required for this path. Small PRs about one historical question are easier to review than broad unexplained chronology replacements.

## Check locally

Only Python 3.10+ is needed for data validation:

```sh
python3 scripts/build-data.py --check
python3 -m unittest discover -s tests -p '*_test.py'
```

Use two-space-indented UTF-8 JSON. Do not edit generated `lib/caribbean.json`, `public/data/`, or `dist/`. The compiler regenerates these files before development, tests and builds. With a running development server, run `npm run data:build` after editing source JSON.

## Event records

```json
{
  "id": "saint-lucia-12",
  "date": "1763-02-10",
  "precision": "day",
  "kind": "treaty",
  "title": "Paris awards Saint Lucia to France",
  "detail": "The peace settlement recognized French possession of Saint Lucia.",
  "controller": "france",
  "sovereign": "france",
  "sources": ["paris1763", "ws-lucia"]
}
```

| Field | Meaning |
| --- | --- |
| `id` | Stable, unique ID prefixed with the island's ID and a hyphen. New suffixes need not be sequential. |
| `date` | `YYYY`, `YYYY-MM` or `YYYY-MM-DD`. Do not invent precision. |
| `precision` | `year`, `month` or `day`, matching the date. `circa` uses a year plus an `uncertainty` note. |
| `controller` | New principal administration, or `null` if it does not change. |
| `sovereign` | New recorded sovereign title, or `null` if it does not change. |
| `kind` | `settlement`, `capture`, `restoration`, `treaty`, `independence`, `withdrawal`, `context-change`, `resistance-change`, `claim`, `context`, `resistance` or `status`. |
| `sources` | One or more IDs from the bibliography. |
| `uncertainty` | Optional text qualifying date or extent; shown with the qualified-change marker. |
| `qualification` | Optional further explanation displayed in the card. |
| `claimant` | Required power ID for a `claim`. |

Claims, context, resistance and status annotations have **both power fields set to `null`**. Occupation does not automatically annex an island. A treaty can change title before a new administration takes over. Power IDs are in [data/owners.json](data/owners.json).

For same-day transitions, array order is meaningful. Preserve intervening changes even when a plotted period has zero duration. Correct dates may require updating historical test fixtures; explain the evidence in the same PR.

## Sources and interpretation

Prefer treaties, local scholarship, museums, libraries, archives and government histories. A source entry needs `id`, `title`, `publisher`, `type`, an HTTPS `url`, and an `accessed` date in `YYYY-MM-DD` format. A citation establishes provenance, not certainty. Explain conflicting accounts instead of hiding them. Write a short paraphrase rather than copying whole passages from a copyrighted publication.

See [the editorial method](data/methodology.md) for geographic scope, Indigenous histories, sovereignty and partial occupations. Structural validation cannot decide which historical interpretation is right.

## Adding an island, region or power

Discuss substantial scope changes in an issue first so they can receive geographic and historical review. For a new track:

- Add `data/islands/<id>.json` and list its ID in `data/scope.json`; add a modern place there if needed.
- Add an unambiguous short code to `islandUrlCodes` in `lib/atlas-url.ts`, plus a flag mapping in `lib/island-flags.ts` if appropriate. New regions need a slug in `urlRegions`.
- Add a flag asset and retain its license if it is not already bundled. New powers need a reviewed symbol in `components/power-symbol.tsx`.
- Run the full checks. URL mapping tests catch missing or duplicate track codes.

Ordinary date, prose and source corrections need none of these code changes.

## Code contributions

Use `npm ci`, then `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`, and `npm run check:export`. Preserve stable record identities, separate hover from pinned state, keep refresh free of initialization animations, and respect reduced motion. See [the architecture notes](docs/architecture.md).

Data contributions use [CC BY 4.0](data/LICENSE.md); code contributions use [MIT](LICENSE). Contributions must be yours to license. Linked publications keep their own rights.
