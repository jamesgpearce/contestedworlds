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

The plot is native SVG with a choice of linear time or event spacing. Individual lines occupy fixed offsets within each political-power row; these offsets have no ordinal meaning. Treaty dates and actual handovers can differ. The administrative and sovereign views share the same source records. Small quadratic Bézier bends soften corners; the vertical transitions and event markers remain at their recorded dates. Bend radii shrink around closely spaced events and become zero for simultaneous changes or a transfer at the chart boundary.

The interface offers keyboard-operated controls, a year slider, island selection, a complete semantic chronology table, persistent event explanations, visible focus, a skip link and reduced-motion support. The chart spans the page and reflows to the available screen width. On phones, flags and short labels give the plot more width. Powers outside the selected island’s history share an explicit Other row, which can be expanded; comparison mode shows every power. The full date range remains visible and date labels thin out without reducing their size. Secondary controls, stories and island details follow the plot. A small Natural Earth map provides geographic context. Hover is supplementary; the text chronology provides the full history without needing colour perception or precise pointing.

The sticky appearance menu offers Follow system, Light and Dark. Follow system tracks the operating system, including changes while the page is open. An explicit choice is saved in local storage and applied before the first paint; the control still works when storage is unavailable. The visual identity uses a numbered power grid, a cobalt selected route, system sans-serif type and small histories generated from the same timeline data.

Time mode places dates in equal calendar intervals. Events mode spaces distinct recorded dates equally for the selected island; Compare all lines uses the union of the visible islands’ dates. Simultaneous records share a tick. Period boundaries anchor both ends, minor ticks retain every event date, and labels thin out to remain legible. Background histories interpolate between the selected island’s event dates. The caption explicitly identifies the nonuniform time scale; the slider steps through the dated records and announces actual dates to assistive technology.

Line width defaults to even strokes. The optional Recorded changes setting counts control or title changes inside the chosen period. It uses a fixed, restrained square-root scale, including a visible minimum for zero-change histories. Selection changes color and opacity, never the encoded width. These counts reflect the dataset’s source coverage; they do not represent population, area or a comprehensive measure of historical turmoil.

Flags are contemporary identifiers, not reconstructions of period flags. Courland and Gran Colombia use lettermarks, the Order of Malta uses its white cross on red, and multi-polity categories use neutral symbols. The expanded key gives full names and explains the convention. Nine SVG assets are from [flag-icons](https://github.com/lipis/flag-icons), with its MIT notice retained in `public/flags/LICENSE`. See [ITERATIONS.md](ITERATIONS.md) for the separate design checkpoints.

The site is statically exported, with system fonts and no database, analytics, remote font request, map SDK or WebGPU requirement. JSON, CSV, bibliography and editorial notes are downloadable from the page. `dist/client/` can be served by a static host.

## Research and assets

Original dataset prose and structure: CC BY 4.0. Source publications retain their rights. Coastlines: Natural Earth public-domain 1:110m land, clipped to the Caribbean. Island points are approximate geographic locators, not historical boundaries. Code licensing remains a repository-owner choice before open-source publication.

A Sites manifest is included for private preview hosting. It does not make the source repository or site public.
