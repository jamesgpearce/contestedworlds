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
