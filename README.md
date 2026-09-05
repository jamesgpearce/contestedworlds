# A Sea of Empires

An interactive history of Caribbean political power, 1450–2026. Thirty-six tracks cover the 31 places in the original research scope. The visualization distinguishes administration from sovereign title, and European claims from effective control.

## Historical corrections

**Edit `data/islands/<island>.json`.** These are normal, formatted JSON files with stable event IDs. Bibliography entries live in `data/sources.json`. No visualization code needs to change for a corrected date or explanation. See [CONTRIBUTING.md](CONTRIBUTING.md) and the [editorial method](data/methodology.md).

The data is a research edition with explicit qualifications, not a claim of archival certainty. Source links document the evidence; structural validation cannot determine historical truth.

## Develop

Requires Node 22.13+ and Python 3.10+.

```sh
npm ci
npm run dev
```

Both development and production regenerate the compact runtime dataset from the editable source files. To edit data with the server running, run `npm run data:build` after saving; the browser then updates through the normal development reload.

```sh
npm run data:check  # Check historical data without writing generated files.
npm test           # Contributor validation and timeline/geometry contracts.
npm run lint       # Implemented application and the UI primitives it uses.
npm run build      # Pre-render the page and create dist/client/.
```

Generated `lib/caribbean.json`, `public/data/`, and `dist/` are ignored by Git. The included GitHub Actions workflow checks dataset contributions and the production build. A JSON Schema supplies editor assistance; the Python compiler additionally verifies calendar dates, citation references, chronological order and political semantics.

## Design and accessibility

The plot is native SVG on a linear time axis. Individual lines occupy fixed offsets within each political-power row; these offsets have no ordinal meaning. Treaty dates and actual handovers can differ. The administrative and sovereign views share the same source records.

The interface offers keyboard-operated controls, a year slider, island selection, a complete semantic chronology table, persistent event explanations, visible focus, a skip link and reduced-motion support. Small screens scroll the wide graph horizontally. A small Natural Earth map provides geographic context. Hover is supplementary; the text chronology provides the full history without needing colour perception or precise pointing.

The sticky appearance control offers Auto, Light and Dark. Auto follows the operating system, including changes while the page is open. An explicit choice is saved in local storage and applied before the first paint; the control still works when storage is unavailable. The visual identity uses a numbered power grid, a cobalt selected route, system sans-serif type and small histories generated from the same timeline data.

The site is statically exported, with system fonts and no database, analytics, remote font request, map SDK or WebGPU requirement. JSON, CSV, bibliography and editorial notes are downloadable from the page. `dist/client/` can be served by a static host.

## Research and assets

Original dataset prose and structure: CC BY 4.0. Source publications retain their rights. Coastlines: Natural Earth public-domain 1:110m land, clipped to the Caribbean. Island points are approximate geographic locators, not historical boundaries. Code licensing remains a repository-owner choice before open-source publication.

A Sites manifest is included for private preview hosting. It does not make the source repository or site public.
