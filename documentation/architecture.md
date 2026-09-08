# Code structure

The static page uses React component APIs and types, with Vite aliasing the browser runtime to `preact/compat`. Rendering and interaction run in the browser; data compilation is a dependency-free Python step. There is no runtime server. The npm dependency set contains the UI primitives actually used by the atlas; obsolete starter modules and the former line-chart renderer are retained only in Git history.

## Data to pixels

1. `data/islands/*.json`, bibliography, powers, eras and scope are the editable research sources.
2. `scripts/build-data.mjs` validates every input before generating `src/lib/caribbean.json` and downloadable JSON/CSV/reference files. Unknown fields, malformed text, invalid dates, missing citations and claim/control confusion fail here.
3. `lib/history.ts` supplies shared types, date formatting and political state. Date formatters are reused.
4. `lib/periods.ts` derives periods with stable IDs, clips visible geometry and packs simultaneous holdings into lanes. Clipping retains the real historical endpoint used by the card.
5. `lib/event-axis.ts` maps the selected dates onto equal event intervals; `lib/year-range.ts` defines inclusive calendar windows.
6. `components/history-chart.tsx` renders SVG rectangles and connectors. It caches labels, routes and claim-to-period matches; hover and animation do not repeatedly format the whole chronology.

`lib/chart-inspection.ts` resolves the island, record, dates, power and citations together. A card must never combine information from different targets. The initial period uses the island's Indigenous/context description. Claim records retain their exact dates and claimant.

## State and interaction

`lib/atlas-url.ts` owns the query contract and the URL store. `use-atlas-view.ts` connects it through `useSyncExternalStore`. Static HTML cannot know the URL query or container width: the plot waits for both before its first visible frame. Restoration snaps into place; deliberate grouping changes animate. Reduced motion makes transitions immediate.

Selection membership, a pinned target and transient hover are distinct. Hover never writes the URL. A clicked target holds its details until replaced or dismissed. The card uses the rectangle's bounds, not pointer coordinates. Chart marks are outside the Tab order at the project's chosen interaction boundary; ordinary controls retain keyboard behavior, and a selected island has a linked chronology and Previous/Next controls.

`site.config.json` and `src/lib/site-config.ts` centralize the public URL, Analytics ID and asset prefix. `vite.config.ts` writes the static bundle directly to `docs/`. `scripts/prepare-static.mjs` adds the Pages fallback, CNAME and crawl metadata; `check-export.mjs` checks actual generated asset links and metadata under both root and project paths.

## Bundle size

The complete history dataset stays embedded in the JavaScript, so the atlas needs no separate data request. Preact's compatibility layer replaces React DOM's larger renderer without changing component imports; the browser suite covers the resulting interactions. React packages remain installed for the React API/types and Lucide's peer dependency, but are aliased out of the browser bundle.

`npm run size:compare` measures both Oxc and three-pass Terser against the entire JavaScript graph without writing `docs/`. Oxc currently produces the smaller gzip output and is the production default. Shared viewport listeners and a direct `clsx` re-export remove repeated runtime wrappers; source formatting is left readable because the minifier removes whitespace.

The build generates level-9 `.gz` siblings for text assets, including JSON/CSV downloads. `npm run check:export` decompresses every sibling, compares it byte-for-byte with its original, checks reproducible compression, and enforces a total JavaScript gzip budget below **100,000 bytes across all chunks**. These sizes describe the local build; a host's on-the-fly compression level can produce different transfer sizes. See [HTTP compression](deployment.md#http-compression).

## Validation

- `data:check` validates contributor data before builds.
- Vitest exercises the real TypeScript timeline, periods, URL, theme and analytics modules. Historical fixtures explain important distinctions such as occupation without annexation.
- Lint covers all application components; TypeScript checks the complete source tree.
- Static-export checks verify referenced files, metadata, image dimensions, downloads, the client entry and CNAME.
- Playwright builds and serves the production artifact, then checks interaction in Chromium, Firefox and WebKit, with additional touch-emulated phone profiles. The suite uses behavior and geometry assertions, with traces and screenshots on failure; `npm test` runs the separate Vitest suite.
- CI runs data checks separately, then application tests, browser tests and root/project-path exports. Pages deployment is gated on those checks.

The audit's automated checks are not a new physical-device or screen-reader certification. Older browser observations are archived in [validation-history.md](validation-history.md); they should not be confused with evidence for the current build. Historical accuracy still requires source review.

## Small changes stay small

Keep original record IDs stable. Prefer explicit, pure timeline transformations to another state store or charting dependency. Do not derive population, land area or historical certainty from rectangle thickness. Regenerate share assets through `npm run social:build`; they reuse the plotting modules and actual Greater Antilles records.
