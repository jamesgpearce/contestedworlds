# Contested Worlds

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

The original two-territory mark uses a stepped open boundary and remains legible at favicon size. The masthead follows the page appearance; the SVG favicon follows the browser’s light/dark preference. A standalone mark is available in `public/mark.svg`.

The plot uses the same native SVG rectangles in two arrangements. Islands gives each selected island a row; Powers packs periods into parallel lanes inside each political-power band. Non-overlapping periods may share a lane, with a preference for keeping returning islands in their previous lane. The chart animates the same keyed rectangles vertically and changes their height over 620 ms; horizontal positions and power colors stay fixed. Thin cubic Bézier connectors appear in Powers. Reduced-motion preferences make the switch immediate, and resizing or changing the selection does not trigger a regrouping animation. Neither lane position nor rectangle height represents population, land area or importance.

The checkbox picker selects islands individually or by region. Region checkboxes show selected counts and a mixed state for partial selections; clicking a partial region selects the rest, while clicking a complete region clears it. Select all and Clear selection work across regions. An empty selection shows an invitation to choose islands without stale island details. All 36 may be included; dense selections expand vertically rather than hiding concurrent holdings. The closed picker names all islands, one complete region, one island, or the first two islands and the remaining count. Individual and regional checkboxes are the single place to change membership; there is no separate selection summary or tag list. Hovering or focusing a rectangle highlights its island and opens an attached card with the power, full dates, initiating event, direct citations and evidence notes. Clicking pins the island and card at the rectangle corner without recentering; other hovers do not replace a pin. Clicking another rectangle replaces the pin, while clicking elsewhere or pressing Escape clears it. A protected pointer corridor keeps the card steady while crossing neighbouring tracks on the way to Pin details, citations or navigation; leaving that corridor resumes normal chart inspection. Inspection never changes selection membership, axes or stacking. Left/right arrows step through periods, up/down move between islands, and Home/End reach the first/last period. Native previous/next controls and linked chronology provide alternatives to precise pointing. Claim markers are shown by default and their cards explicitly name the claimant with “Claim by”. Claim diamonds sit at their exact dates within the corresponding island period, with their outline identifying the claimant; uncertain changes retain hollow markers.

The top bar offers By Island / By Power when multiple islands are selected; a single island uses power grouping. The table experiment remains in Git history. Options contains Time / Events for x-axis spacing, Administration / Sovereign title, editable start and end years, regional presets, and independent checkboxes for claim and qualified-change markers. Date presets come directly from the Regional history records. Ranges include the final calendar year and may cover a single year; invalid entries leave the chart unchanged. Year edits apply on blur or Enter. Hiding qualified markers keeps their periods and evidence notes available. The panel stays open while controls change and supports Escape to return focus to the trigger. Both chart arrangements fit the available width. On phones the labels sit above the bands, leaving almost the full width for dates. The period card always sits below the rectangle, aligned to its left edge or to its right edge when the card would overflow the screen. A final horizontal clamp handles narrow screens where neither corner can fit the full card. Pointer position does not affect placement; long cards scroll internally on small screens. Power names carry a faint tint matching their periods in both appearances. The color legend appears only in the island arrangement, where row labels cannot identify the powers; marker symbols are explained beside their option checkboxes. A muted palette runs through power periods, map dots and the site's light and dark surfaces. The sticky appearance button cycles through Auto (following the system), Light and Dark, with pre-paint preference resolution, persistent overrides, live system changes and a storage-failure fallback. Interface controls use Lucide SVG icons: Sun–Moon for system appearance, Sun for light, Moon for dark, and rotating chevrons for native disclosure sections.

Opening periods describe the island’s Indigenous societies from the dataset instead of its whole-history summary. The island background appears expanded for a newly pinned island, combining historical notes, the locator map and every dated record, including contextual and claim records absent from the plotted periods. Choosing a chronology entry brings its card into view and expands the time window if necessary. There is no duplicate period panel below the chart. The Context, Sources and Method blocks follow in the same order as their introductory links, with regional history, the complete bibliography and dataset downloads, then scope, uncertainty and the flag key. The masthead gives the atlas name and Caribbean subtitle; quiet links beside the subtitle open context, sources and method. Duplicate event cards, the lower island picker and story tiles have been removed.

The atlas opens with all 36 islands selected, grouped by power with event spacing and claim markers visible. Time uses calendar spacing. Events uses the sorted union of relevant administration or sovereignty changes for the selected islands, plus claims only when enabled. Contextual records do not add hidden gaps. Simultaneous dates share a tick; period boundaries anchor the range; labels thin out while retaining every minor tick. Switching the arrangement does not change that scale. The earlier line-width experiment is retained in Git history, not applied to rectangles.

Flags are contemporary identifiers, not reconstructions of period flags. Courland and Gran Colombia use lettermarks, the Order of Malta uses its white cross on red, and multi-polity categories use neutral symbols. The expanded key gives full names and explains the convention. Nine SVG assets are from [flag-icons](https://github.com/lipis/flag-icons), with its MIT notice retained in `public/flags/LICENSE`. See [ITERATIONS.md](ITERATIONS.md) for the separate design checkpoints.

The site is statically exported, with system fonts and no database, analytics, remote font request, map SDK or WebGPU requirement. JSON, CSV, bibliography and editorial notes are downloadable from the page. `dist/client/` can be served by a static host.

## Research and assets

Original dataset prose and structure: CC BY 4.0. Source publications retain their rights. Coastlines: Natural Earth public-domain 1:110m land, clipped to the Caribbean. Island points are approximate geographic locators, not historical boundaries. Code is licensed under the [MIT License](LICENSE). Dataset corrections and source-backed pull requests are welcome at [jamesgpearce/contestedworlds](https://github.com/jamesgpearce/contestedworlds); see [CONTRIBUTING.md](CONTRIBUTING.md).

A Sites manifest is included for private preview hosting. It does not make the source repository or site public.
