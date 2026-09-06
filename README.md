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

The plot uses the same native SVG rectangles in two arrangements. Islands gives each selected island a row; Powers packs periods into parallel lanes inside each political-power band. Non-overlapping periods may share a lane, with a preference for keeping returning islands in their previous lane. The chart animates the same keyed rectangles vertically and changes their height over 620 ms; horizontal positions and power colors stay fixed. Thin cubic Bézier connectors appear in Powers. Reduced-motion preferences make the switch immediate, and resizing or changing the selection does not trigger a regrouping animation. Neither lane position nor rectangle height represents population, land area or importance.

The checkbox picker selects islands individually or by region. Region checkboxes show selected counts and a mixed state for partial selections; clicking a partial region selects the rest, while clicking a complete region clears it. Select all and Clear selection work across regions. An empty selection shows an invitation to choose islands without stale island details. All 36 may be included; dense selections expand vertically rather than hiding concurrent holdings. The expandable selection list chooses which island to inspect or removes islands. Clicking a rectangle selects its period; a stable detail panel names the island, power, dates and initiating event. Hover is a temporary, explicitly named preview and never changes selection, axes or stacking. Left/right arrows step through periods, up/down move between islands, and Home/End reach the first/last period. Native previous/next controls, the year slider, chronology and semantic table provide alternatives to precise pointing. Claims remain separate markers, nearby claims are staggered, and uncertain changes retain hollow markers.

The top bar offers four explicit displays: Chart by Island, Chart by Power, Table by Island and Table by Power. Both table arrangements contain the same selected-island periods as the charts, with dates, power colors, explanations and sources. They respect the political-power mode and period window; selecting a row updates the island inspector. Time / Events and the year slider appear only in chart views, preserving the last chart spacing choice. The Options button opens Administration / Sovereign title and the period filter; claim markers are offered in chart views. The panel stays open while controls change and supports Escape to return focus to the trigger. Both arrangements fit the available width. On phones the labels sit above the bands, leaving almost the full width for dates. The hover-only preview floats at the upper right while scrolling, without reserving an extra row or moving the chart. Selected-period details appear below the plot. A muted palette runs through power periods, legends, map dots, story strips and the site's light and dark surfaces. The sticky appearance menu offers Follow system, Light and Dark, with pre-paint preference resolution, persistent overrides, live system changes and a storage-failure fallback.

Time uses calendar spacing. Events uses the sorted union of relevant administration or sovereignty changes for the selected islands, plus claims only when enabled. Contextual records do not add hidden gaps. Simultaneous dates share a tick; period boundaries anchor the range; labels thin out while retaining every minor tick. Switching the arrangement does not change that scale. The slider announces actual dates and steps through the same event domain. The earlier line-width experiment is retained in Git history, not applied to rectangles.

Flags are contemporary identifiers, not reconstructions of period flags. Courland and Gran Colombia use lettermarks, the Order of Malta uses its white cross on red, and multi-polity categories use neutral symbols. The expanded key gives full names and explains the convention. Nine SVG assets are from [flag-icons](https://github.com/lipis/flag-icons), with its MIT notice retained in `public/flags/LICENSE`. See [ITERATIONS.md](ITERATIONS.md) for the separate design checkpoints.

The site is statically exported, with system fonts and no database, analytics, remote font request, map SDK or WebGPU requirement. JSON, CSV, bibliography and editorial notes are downloadable from the page. `dist/client/` can be served by a static host.

## Research and assets

Original dataset prose and structure: CC BY 4.0. Source publications retain their rights. Coastlines: Natural Earth public-domain 1:110m land, clipped to the Caribbean. Island points are approximate geographic locators, not historical boundaries. Code licensing remains a repository-owner choice before open-source publication.

A Sites manifest is included for private preview hosting. It does not make the source repository or site public.
