# Validation record

8 September 2026. Commands run from the repository root.

## Automated checks

- `npm test`: 15 Python contributor checks and 40 JavaScript/TypeScript domain checks pass. These cover dataset shape and references, real calendar dates, stable event identities, URL restoration, claims versus control, precise period dates, clipping, lane packing, event spacing, theme preferences and Analytics configuration.
- `npm run lint` and `npm run typecheck` pass for the application and its remaining component primitives.
- `npm run build && npm run check:export` checks the deployable static artifact: local asset references, downloads, canonical and social metadata, image dimensions, crawler files and the absence of a provisional server-rendered chart.
- The static export is checked both at `/` and at the GitHub project path `/contestedworlds`. The latter is flattened before upload, because Pages supplies that path itself.
- The 1200×630 share card uses the real Greater Antilles period geometry, event axis and local SVG flags. The generated PNG was visually inspected.

The audited source retains 36 island histories, 433 event records and 68 bibliography entries. No historical dates or power transitions were changed by this code audit. Fine-grained sequences and qualified dates still warrant specialist review; structural validation is not historical proof.

## Changes caught by the audit

- A viewing window ending mid-period could replace a tooltip's historical end date with the window boundary. Periods now retain their actual next event; a regression check covers clipped histories in both political modes.
- Hover and animation renders repeatedly formatted every period date and resolved every claim. Those derived records are now memoized, and date formatters are reused.
- Removed retired chart geometry, unused starter components, unreferenced style rules and their unused dependencies. Updated affected runtime/build dependencies and retained third-party notices.
- Added stricter contributor validation for unknown fields, malformed optional notes, coordinates, source URLs, non-finite numbers and event/context identifiers. Validation completes before generated files are written.

## Verification boundaries

This final audit used source inspection, automated checks, static artifact checks and a generated-image review. It did **not** repeat interactive browser, physical-device or screen-reader testing. Earlier browser observations are preserved in [docs/validation-history.md](docs/validation-history.md); some describe superseded interface experiments.

GitHub Actions, public-domain DNS/HTTPS, Analytics Realtime and social-crawler retrieval require the repository and domain to be published. The setup and live checks are in [docs/deployment.md](docs/deployment.md).
