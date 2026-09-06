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
