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

## Calendar windows and marker checkboxes · 7 September 2026

Removed Explore a year. Start and end year inputs now set the chart window, applying on blur or Enter; reversed, blank and out-of-bounds entries preserve the previous window. Both endpoints are calendar years, including dated events through 31 December of the final year, and a single-year window is supported. Presets use the exact titles and bounds from Regional history, alongside The whole story. Claim markers and qualified changes have independent checkboxes; hiding the latter does not hide historical periods or their evidence notes. Changes preceding the visible start no longer get a false boundary marker at the clipping edge.

Validation: TypeScript, lint and seven period-model tests pass, including closing-year treaty handovers and continuous coverage across every regional preset and a single-year window. Browser checks covered marker toggles, custom and invalid ranges, preset reset, the 1763 treaty events, and regional preset labels at 390 and 320 px. The long menu labels wrap without clipping. No browser errors were recorded.

## Color at the power labels · 7 September 2026

Power names have a ten-percent tint of their chart color behind the text. The redundant color legend is removed in the power arrangement and retained in the island arrangement. Marker symbols live beside their checkboxes in Options. Browser checks covered the legend changing with arrangement and the label tint on desktop and phones in both appearances. The production build passes; historical data and dependencies are unchanged.

## Consistent Lucide controls · 8 September 2026

The system appearance choice uses Lucide Sun–Moon, alongside Sun for light and Moon for dark. Native disclosure triangles are replaced with Lucide chevrons that turn with the open state, and the bibliography's duplicate expansion arrow is removed. Existing navigation, dropdown, download and marker-option icons already use Lucide. TypeScript, lint and production build pass; browser checks confirm all three appearance icons and keyboard expansion with the correct chevron direction. No dependencies or historical data changed.

## Attached period details · 8 September 2026

Hover and keyboard focus resolve one explicit rectangle into its island, power, dates, full event text, evidence notes and citations. The same target drives the highlighted route and the attached card. Clicking pins both until another rectangle is clicked, a click elsewhere, or Escape; the card offers previous/next navigation. About appears only for a pinned island and retains the complete chronology. The lower selected-period readout and upper preview strip are removed. Virtual anchoring follows changes of rectangle and viewport collision handling keeps the card on screen.

Validation: the dataset remains 36 tracks, 433 events and 68 sources. Model tests cover every rectangle in both political-power modes, stale/cross-island targets, and every claim/context record. Browser checks cover keyboard inspection, pinning, next-period navigation, selecting another island, outside dismissal, Escape focus return, and phone card positioning.

## Sea of Empires masthead · 8 September 2026

The main title is now Sea of Empires, with the subtitle “Caribbean islands through conquest, occupation and independence.” One masthead replaces the separate Caribbean logo strip and repeated title; the appearance menu stays in reach. Context, Sources and Method links move to the footer and open their reference sections. The browser title follows the shorter name. A separate regional subtitle leaves room for future editions.

## Contested Worlds · 8 September 2026

Renamed the atlas to Contested Worlds across the masthead, browser title, footer, project metadata and dataset documentation. Caribbean remains the edition, leaving the name suitable for future regional histories.

## Stable pinning and opening societies · 8 September 2026

The card retains its hover anchor when focus and click pin the same rectangle. Anchoring measures only the period body, excluding selection ornaments and hit areas; the pin control keeps the same footprint in both states. Opening periods use the existing peoples description rather than the whole-history summary. The country background starts expanded when an island is selected. Browser checks measured identical card bounds before and after off-centre chart clicks and the Pin details control, including a 320 px viewport.

## A shared boundary · 8 September 2026

A design-agent identity study produced two equal territories separated by a stepped open seam. The compact SVG joins the existing title and replaces the old favicon; light/dark treatments use the site’s muted green and clay palette. The original mark needs only two paths, with no new image or font dependency.

## Predictable rectangle corners · 8 September 2026

Cards now always anchor below their rectangle: left-aligned by default, right-aligned to its right edge if the card would overflow. Horizontal clamping covers phone widths where neither alignment fits. Pointer coordinates and saved attachment fractions are removed, and cards no longer flip above the period as their content changes.

## Axis spacing in Options · 8 September 2026

Moved the Time / Events choice into Options under X-axis spacing, with a short explanation of each mode. The top bar retains island grouping and Options; event spacing remains the default.

## Claims within their periods · 8 September 2026

Claim diamonds are centered within their island’s period rectangle, using the same period resolver as the metadata card. Removed the vertical staggering that could place them in another island’s lane. Exact dates and claimant colors are preserved in both chart arrangements and during the transition between them.

## Three-state appearance button · 8 September 2026

The compact Lucide appearance button cycles Auto → Light → Dark → Auto without opening a menu. Its accessible label and native tooltip name the current preference and next action. Existing persistence, system tracking and pre-paint theme resolution are preserved.

## Reachable hover details · 8 September 2026

Moving from a rectangle or claim into its card temporarily protects that target along the pointer’s path. Neighbouring tracks crossed en route do not replace the card; leaving the corridor restores normal hovering. Entering the card cancels dismissal, and pinning, keyboard focus and outside dismissal retain their existing behavior. Geometry regression tests cover both alignments, narrow screens and deliberate movement away from the card.

## References at the introduction · 8 September 2026

Context, Sources and Method move from the footer to quiet inline links beside the subtitle. They wrap below it on smaller screens and retain the direct opening of each reference section. The footer keeps only edition information.

## Explicit claims, visible by default · 8 September 2026

Claim cards now say “Claim by” before the power’s name, so their status is explicit in both hover and pinned details. Claim markers start enabled; the existing Options checkbox still hides them and removes their dates from event spacing.

## Direct claim targeting · 8 September 2026

Measured the claim diamonds and their hit circles: their centers agree. The apparent offset came from hover protection keeping the underlying period active. Entering a claim directly from its containing rectangle now hands inspection to the claim immediately, while paths into the metadata card remain protected.

## The whole region on arrival · 8 September 2026

All 36 island tracks are selected initially, derived from the dataset so future additions are included automatically. Grouping by power, event spacing and visible claims remain the defaults; individual and regional selection controls are unchanged.

## Matching reference blocks · 8 September 2026

The lower blocks are now titled Context, Sources and Method, in that order, matching the subtitle links. Context holds the regional history; Sources holds the bibliography and downloads; Method holds the editorial scope and flag conventions. Existing section anchors remain valid.

## Open-source contribution path · 8 September 2026

Added the owner-selected MIT code license, retaining CC BY 4.0 for the original dataset. Method invites evidence-backed dataset pull requests and links to the contribution guide. The footer links to the planned `jamesgpearce/contestedworlds` repository; repository creation is separate.

## Flags for island rows · 8 September 2026

Island grouping now places modern country or territory SVG flags beside island names, matching the size and muted treatment of power-row flags. Related islands may share a national flag. The assets extend the existing pinned flag-icons release, with its license retained and no new runtime dependency.

## Island names at the start of each track · 8 September 2026

Power grouping now right-aligns a small island name beside each first visible rectangle. Labels use the actual starting power, including Shared / unsettled, and follow custom date windows. Power headings move above rows with these names; Indigenous is shortened in the row heading. A compact label column keeps the names separate from dates on phones.

## Claim headings that add context · 8 September 2026

Claim cards omit event headings that merely restate the claimant and current island name. Specific voyages, patents, competing or qualified claims, and historical place names retain their headings. Two descriptions no longer restate the claim. Original event titles remain in the dataset and chronology; dates, powers, citations and qualifications are unchanged.

## A distinct Maltese cross · 8 September 2026

The Knights of Malta now use the Order's eight-pointed white cross on red, distinguishing them from Denmark's Nordic cross. The chart and expanded key share one lightweight SVG. Flag conventions identify it as the Order's emblem, with the official reference retained.

## Shareable chart views · 8 September 2026

The address bar now holds the selected islands, grouping, axis spacing, political mode, calendar range and marker choices. Default values disappear from the URL; other island selections use a versioned base-36 bitmask with fixed positions independent of dataset ordering. The URL restores through hydration, refresh and browser navigation, and changes replace the current history entry. Appearance stays personal and inspection stays transient. Tests cover stable links, all 36 island positions, invalid inputs, option combinations and URL synchronization.

## Readable shared selections · 8 September 2026

New links name regions and islands directly, for example `islands=greater-antilles,saint-lucia`. Complete groups collapse to their region slug; all islands remain the omitted default, and `none` preserves an empty selection. Older encoded links remain readable and convert on the next edit.

## Shared pinned details · 8 September 2026

Clicking a rectangle or pinning a claim writes its stable record ID to `detail`; initial periods use `island-id.initial`. Refresh and browser navigation restore the same card and About panel, revealing its anchor after chart measurement. Previous/Next updates the record, dismissal removes it, and a filter that removes the target clears the pin. Hover stays transient. Restoration tests cover every rectangle in both political modes, every claim, clipped periods and invalid targets.

## Details below the masthead · 8 September 2026

Chart cards now sit above the visualization but below the sticky masthead and control menus. Their fixed relationship to the rectangle is preserved as they scroll underneath the title bar.
