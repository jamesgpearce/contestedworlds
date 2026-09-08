# Validation record

8 September 2026. Commands run from the repository root.

## Automated checks

- `npm run test:browser`: 31 Playwright checks pass locally on macOS against the production build, across Chromium, Firefox, WebKit and touch-emulated Chromium/WebKit phones. Coverage includes shared filters and pinned details, real back/forward navigation, SVG hover/click, keyboard menus and chronology, native year controls, theme persistence and cross-tab updates, reduced motion, resizing, and 320/390 px layouts in light and dark. The CI job installs all three engines and retains failure traces, screenshots and its HTML report for 14 days; the hosted job has not been run from this workspace.
- `npm test`: 55 Node.js checks pass. These cover contributor data validation, real calendar dates, duplicate JSON keys, stable event identities, URL restoration, claims versus control, precise period dates, clipping, lane packing, event spacing, theme preferences and Analytics configuration.
- `npm run lint` and `npm run typecheck` pass for the application and its remaining component primitives.
- `npm run build && npm run check:export` checks the deployable static artifact: local asset references, downloads, canonical and social metadata, image dimensions, crawler files and the absence of a provisional server-rendered chart.
- The static export is checked both at `/` and at the GitHub project path `/contestedworlds`. Both builds place the deployable files directly in `docs/`.
- The 1200×630 share card uses the real Greater Antilles period geometry, event axis and local SVG flags. The generated PNG was visually inspected.

The audited source retains 36 island histories, 433 event records and 68 bibliography entries. No historical dates or power transitions were changed by this code audit. Fine-grained sequences and qualified dates still warrant specialist review; structural validation is not historical proof.

## Changes caught by the audit

- Browser regressions exposed focus loss when clearing the island selection, WebKit tap/blur races when closing menus, and an Options panel that could extend outside phone viewports. Clear now moves focus to an enabled action, blur handling preserves trigger taps, and the panel measures available space before opening and follows scrolling/resizing. The corrected 320 px panel was visually inspected.
- A viewing window ending mid-period could replace a tooltip's historical end date with the window boundary. Periods now retain their actual next event; a regression check covers clipped histories in both political modes.
- Hover and animation renders repeatedly formatted every period date and resolved every claim. Those derived records are now memoized, and date formatters are reused.
- Removed retired chart geometry, unused starter components, unreferenced style rules and their unused dependencies. Updated affected runtime/build dependencies and retained third-party notices.
- Added stricter contributor validation for unknown fields, malformed optional notes, coordinates, source URLs, non-finite numbers and event/context identifiers. Validation completes before generated files are written.

## Verification boundaries

The browser suite adds repeatable interaction checks to the source, domain and static-artifact audit. Phone profiles emulate viewports and touch; this work did **not** perform physical-device or screen-reader testing. Earlier browser observations are preserved in [documentation/validation-history.md](documentation/validation-history.md); some describe superseded interface experiments.

GitHub Actions, public-domain DNS/HTTPS, Analytics Realtime and social-crawler retrieval require the repository and domain to be published. The setup and live checks are in [documentation/deployment.md](documentation/deployment.md).
