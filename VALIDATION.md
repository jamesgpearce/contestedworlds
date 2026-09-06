# Validation record

6 September 2026.

- All 31 jurisdictions in the supplied scratch pad are represented, in 36 tracks.
- The contributor compiler validates all 433 events and 68 bibliography entries before generating output. Thirty-six event records explicitly qualify their date or extent.
- Nine contributor safety tests pass, including a harmless text correction, a broken source, invalid calendar dates, claim/control confusion, power-name typos, date precision, event ordering, duplicate JSON keys, and deterministic compilation.
- Seven tests of the real timeline module pass: Guadeloupe's Swedish title under British administration, Haiti's occupation without annexation, Havana's limited occupation, the Treaty of Basel preceding administrative change, exact-day transitions, every path's finite coordinates and correct ending state in both modes and all three periods, and preserved date precision.
- Four appearance tests pass: first-paint preference resolution, persistence across reloads, live system changes with explicit overrides, and blocked storage/cross-tab synchronization.
- TypeScript and the implemented application/used-primitives lint pass. The unused generated component library is outside the application lint command.
- The production static export passes. The local route returns HTTP 200. An SVG title hydration mismatch found in development was corrected; the subsequent server logs show successful renders without that warning.
- The initial published version’s WebMCP tools were checked after the browser connection issue was resolved. The appearance update preserves those tools and the historical dataset.
- Responsive browser checks covered 320×568, 390×844, 768×1024 and 1440×900 viewports. The full chart fits the opening viewport without page overflow at the tested phone sizes. The island picker (including long names), period controls, sovereign view, table, chart-event selection and event-detail link were exercised; light and dark phone layouts were inspected. A multi-part SVG title hydration issue found on a fresh reload was fixed and the reload verified. These are viewport checks, not physical-device or screen-reader testing.
- Three geometry checks cover every historical path at phone and desktop widths, legible endpoint/date-tick spacing, and restrained Bézier bends that keep exact transition dates, preserve same-day order and never overshoot their power rows or the date range.

Historical validation is distinct from structural validation. Many fine-grained colonial dates rely on a secondary chronology. Qualified early sequences should receive specialist review and correction through the documented contribution process.

## Chart experiments

- 28 automated checks pass: nine contributor checks, twelve history/geometry checks, three event-axis checks and four appearance checks.
- Grouped power rows retain every administration or sovereign in the selected island’s period. Other histories retain an explicit Other destination; expansion and comparison restore all fifteen rows.
- Event-axis tests cover duplicate dates, empty periods, equal event spacing, monotonic interpolation, inverse navigation and label spacing. Width tests distinguish Guadeloupe’s 1813 title transfer from its unchanged administration and verify the selected date window.
- Browser checks covered 320×568, 390×844, 768×1024 and 1440×900, including dark mode, the appearance radio menu, long island names, grouped/expanded power rows, event spacing, keyboard stepping through dates, and the recorded-change width legend. The narrow phone chart fits without horizontal page overflow. A fresh tablet reload reported no new browser errors. Wider label clearance was measured and corrected.
- Existing chronology tests and all canonical historical JSON files remain unchanged in substance. No historical population or area data was introduced. These are browser viewport checks, not physical-device or screen-reader testing.

## Shared-period atlas · 7 September 2026

This section supersedes the old single-line layout and width experiment above.

- 33 automated checks pass: nine contributor checks, twelve history/geometry checks, three event-axis checks, four appearance checks and five period/packing checks.
- Period checks cover every island in administration and sovereignty modes across all three ranges: complete coverage, correct interior power, stable keys when clipped, deterministic packing without concurrent overlap, and both layouts fitting their bands at phone and desktop widths. Context-only records are excluded from the event grid; claims are included only when enabled.
- Browser checks exercised checkbox selection without closing the menu, removing the inspected island, retaining just one island, all 36 islands (338 administration rectangles), both arrangements, event spacing, keyboard stepping within and between islands, and precise selection of nearby claim markers. A hit-target overlap between the two early Saint Lucia claims was found and fixed by staggering the markers.
- The arrangement transition was observed in the browser: sampled rectangles retained their IDs, x positions and widths while their y coordinates changed. The implementation respects reduced motion and cancels or finishes interrupted animations. Reduced-motion behavior was inspected in code; it was not tested by changing the device's system setting.
- Viewports checked: 320, 390, 768 and 1440 pixels wide. The measured charts fit without horizontal page overflow after hydration, with readable labels above phone bands. Both site appearances were inspected. A containment rule also prevents the provisional server-rendered chart width from overflowing before measurement.
- A fresh tablet load reported no browser console errors. An initial keyboard probe ran before hydration; after the controls were ready, keyboard movement selected and focused the correct period on the next island. These are browser viewport checks, not physical-device or screen-reader testing.
- TypeScript, application lint and the production static export pass. The 433 canonical event records and 68 sources are unchanged; generated periods do not alter the contributor dataset. No new dependencies, fonts, map SDK or population/area metadata were introduced.
