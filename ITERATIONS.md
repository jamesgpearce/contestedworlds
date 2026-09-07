# Chart design checkpoints

Each step is a separate commit and a source snapshot for comparison. The editable historical dataset is unchanged.

| Commit    | Experiment                                                          | Where to inspect it                               |
| --------- | ------------------------------------------------------------------- | ------------------------------------------------- |
| `0d14a09` | Compact appearance menu and SVG navigation icons                    | Header; Follow system / Light / Dark              |
| `59ba1ad` | SVG flags and short power labels; grouped mobile rows               | Narrow chart; Powers & flags; Expand other powers |
| `c4c351c` | Linear-time and event-spaced axes                                   | Time / Events beside the island picker            |
| `510e4a1` | Quieter background histories, restrained curves and smaller markers | Focused island; selected-event ring               |
| `f6508ef` | Optional width encoding for recorded changes                        | Chart options → Line width → Recorded changes     |

Event spacing reveals sequences rather than elapsed duration. The selected island defines the event grid in focus mode; the visible islands define it in comparison mode. Changing hover never changes the grid or grouped rows.

Width is an optional experiment with the existing evidence. Present-day population would not describe historical population, while land-area comparisons would require definitions consistent with island groups, split islands and proxy tracks. Neither is silently inferred from the locator map. Counts remain qualified by source coverage.

The final validation pass adds label clearance on larger charts and explicit truncation for long island names. See VALIDATION.md for the verification boundary.

## Shared period rectangles · 7 September 2026

- `1883431`: derive stable administration/sovereignty periods and deterministic interval packing, with coverage and non-overlap tests.
- `a09cf1a`: checkbox multiselection and animated Islands/Powers arrangements, a shared event domain, explicit period selection and supplementary hover.
- `3b2dde1`: muted site surfaces in both appearances and consistent power colors in chart, map and story strips.
- The following validation commit improves the sticky selected-period strip, precision of interval end labels, nearby claim targets and keyboard access. README.md describes the current interaction. Earlier grouping and line-width experiments remain reversible in the commits above.

The canonical historical JSON and bibliography remain unchanged. Rectangles are a derived view; contributors still edit the same per-island text files.

## Whole-region selection · 7 September 2026

Region headings are now bulk checkboxes with selected counts and mixed-state indicators. Completing or clearing a region preserves selections elsewhere. Clear selection and an empty state allow the last region or island to be removed; restoring a selection restores the chart and inspector.

Validation: TypeScript, lint and production build pass. Browser checks covered partial-to-full selection (9 to 14), keyboard clearing of that region (14 to 8), unchanged neighboring regions, clearing all islands, restoring a region, and clearing the final region. At 390 px, the picker fits inside the viewport without horizontal overflow. Browser error log was empty. No canonical data or dependencies changed.

## Hover-only preview · 7 September 2026

Removed the duplicate selected-period strip above the plot. A compact, right-aligned preview now floats over the upper-right chart area only while hovering, with the power color on its edge. Its zero-height sticky anchor leaves no empty row and never moves the plot. Selected-period metadata remains below.

Validation: TypeScript, lint and production build pass. Browser checks confirmed an unchanged plot position and selected readout during hover, dismissal on selection and pointer exit, and a 390 px layout with no horizontal overflow. No browser errors were recorded.

## Options in the top bar · 7 September 2026

Replaced the jump to the lower options section with a compact top-bar popover. Administration / Sovereign title, Chart / Table, time period and claim markers remain together and can be changed without closing the panel. The former lower section is removed. The existing Base UI popover handles focus, outside dismissal and Escape; there are no new dependencies.

Validation: TypeScript, lint and production build pass. Browser checks covered both political-power modes, Chart / Table, the nested period selector, claim markers, and Escape returning focus to Options. The panel fits at 390 px and stays within the 320 × 568 viewport with internal scrolling. No browser errors were recorded.

## Four display modes · 7 September 2026

The top-bar switch offers Chart by Island, Chart by Power, Table by Island and Table by Power. Both tables use the same derived periods and selected islands as the charts, regrouped by island or power. Dated rows carry power colors, initiating events, qualifications and sources, and select the island inspector. The previous single-island chronology table is replaced; the inspector retains contextual chronology and background. Time / Events, claim markers and the year slider are chart-only controls. Chart spacing is preserved when returning from a table.

Validation: TypeScript, lint, the five period-model tests and the production build pass. Browser checks verified identical IDs for all 66 default periods in both table arrangements and the chart, 338 unique periods with all islands selected, and 107 matching sovereign-title periods in the 1600–1820 window. Table selection updates the inspector; returning to a chart restores Events spacing. The four-way switch and table fit at 390 and 320 px, with wrapping citations and no horizontal overflow. No browser errors were recorded. Canonical historical data and dependencies are unchanged.

## Single-island choices · 7 September 2026

Island-grouped views are offered only when more than one island is selected. With one island (or an empty selection), the control offers Chart by Power and Table by Power. Reducing the selection preserves the display format and uses power grouping; adding another island restores all four choices. The previous grouping preference is retained unless the user explicitly changes views.

Validation: TypeScript, lint and production build pass. Browser checks covered chart and table fallbacks after keeping one island, restoring all four choices by adding Cuba, and absence of spacing controls in the single-island table. No browser errors were recorded.

## Chart-first reference flow · 7 September 2026

Removed the table views and reduced the display control to By Island / By Power, available when multiple islands are selected. One period readout now carries its explanation, direct citations and evidence notes. The island background, locator and complete dated chronology share one expandable section; chronology entries return to that readout, including claims and contextual records. The year slider moves into Options. Duplicate event cards, the lower island picker and story tiles are removed. Sources and editorial method brings together downloads, regional context, the flag key, all 68 bibliography entries and editorial qualifications. The canonical dataset is unchanged.

Validation: TypeScript, lint and production build pass; the data compiler validates all 36 tracks, 433 events and 68 sources. Browser checks covered both chart arrangements, Events spacing, keyboard period navigation, the relocated slider, chronology selection of a claim and a qualified settlement date, direct citations and the bibliography shortcut. The event readout and source section fit at 390 and 320 px without horizontal overflow, including dark appearance. Browser error log was empty. The existing large-chunk build warning remains; no dependencies were added.

## A single selection control · 7 September 2026

The closed island picker now names the selection: All 36 islands, a complete region, a single island, or the first two island names and the remaining count. Two islands are named without an empty remainder; no selection reads Choose islands. The separate selected/inspecting summary and removable tags are removed, along with their callback and styles. The existing menu retains individual and regional checkboxes, Select all, Clear selection and Keep only.

Validation: TypeScript and lint pass. Browser checks covered all islands, a complete region, one island, two islands, three islands and empty selection. Labels wrap at 390 and 320 px with no horizontal overflow after chart resize. No browser errors were recorded.

## Powers and events by default · 7 September 2026

The initial chart groups periods by power and uses event spacing. Both controls remain available for switching to island rows or calendar time. TypeScript, lint and production build pass; browser inspection confirms By Power and Events are selected on initialization.
