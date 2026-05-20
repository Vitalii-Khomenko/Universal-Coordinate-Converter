# Universal Coordinate Converter Audit

Date: 2026-05-20

## Scope

This audit reviewed the repository contents, the standalone HTML application, documentation, project rules, license, git hygiene, offline behavior, data import/export workflows, and coordinate transformation logic. The review focused on maintainability, correctness risk, usability, security, documentation consistency, and readiness for local browser use.

Reviewed files:

- `universal-coordinate-converter.html`
- `README.md`
- `Function.txt`
- `rules.txt`
- `AGENTS.md`
- `LICENSE`
- `.gitignore`

## Executive Summary

The project is a compact and usable local browser-based coordinate conversion tool. Its main strength is that the core conversion workflow is contained in a single HTML file and the main coordinate calculations do not require a backend. TXT import/export is available, and map/KML features are present for practical field-style workflows.

The main risks are mathematical traceability, reference-data quality, dependency resilience, and longer-term UI accessibility. The application is functional in concept, and the active transformation formulas are intentionally preserved in `universal-coordinate-converter.html`. `Function.txt` now documents that source-of-truth policy instead of duplicating executable formula code.

## Overall Rating

Status: usable prototype with important correctness and hardening work still needed.

Priority areas:

1. Add authoritative reference-point tests for all conversion directions.
2. Reconcile `Function.txt` with the actual formulas in `universal-coordinate-converter.html`.
3. Escape user-provided values before writing table rows or KML.
4. Improve offline fallback behavior for optional CDN features.
5. Clean repository state and align `.gitignore` with `rules.txt`.

## Follow-Up Fixes Applied

Update date: 2026-05-20

The following audit items were addressed without changing coordinate transformation formulas:

- User-provided point IDs are now written to result tables with `textContent`, and KML point names are XML-escaped.
- Map initialization now checks whether OpenLayers loaded and shows a clear English message when map visualization is unavailable.
- Imported TXT filenames are tracked separately for GK, WGS84, and SWEREF99 workflows.
- Map and KML export now include WGS84 coordinates from WGS84-to-target result rows.
- Project guidance now states that each functional update must be tested, committed, and pushed to GitHub.
- `Function.txt` is now documentation only, with `universal-coordinate-converter.html` as the formula source of truth.
- `VALIDATION.md` records the current regression baselines and validation limitation.
- The SWEREF conversion handler is now correctly named `convertSwerefToWGS84`, with a compatibility wrapper for the previous misspelling.
- `.gitignore` now uses broader generated-export patterns and matches the repository policy.
- Tabs are now semantic buttons with tab roles, ARIA state, and keyboard arrow navigation.
- Inline event attributes and inline UI styles were moved into CSS and JavaScript event listeners.
- README examples now separate GK and SWEREF99 input formats and use a SWEREF99 example within the practical EPSG:3011 area.

## File Inventory

### `universal-coordinate-converter.html`

Role: main self-contained browser application.

Observed features:

- Four tabs: GK to WGS84, WGS84 to target system, SWEREF99 18 00 to WGS84, and map.
- In-browser transformation functions.
- TXT import and export.
- Map visualization through OpenLayers and OpenStreetMap tiles.
- KML export.

Strengths:

- The main app remains one file, matching the project guidance.
- Core coordinate calculations are implemented directly instead of using external calculation libraries.
- Input parsing tolerates blank lines and comment lines starting with `#` or `//`.
- Basic numeric validation is present.
- TXT files are limited to 5 MB.
- The UI is responsive enough for smaller screens and includes touch-size media rules.

Concerns:

- Mathematical functions are embedded directly in the UI file with duplicated or drifting documentation.
- Result rows now use safe DOM text insertion for imported point IDs.
- Map features now guard against a missing OpenLayers global and show a clear user-facing message.
- Import filenames are tracked separately per conversion workflow.
- WGS84 target-system result rows are included in map and KML export.
- The SWEREF conversion handler is correctly named `convertSwerefToWGS84`; `convertSwerfToWGS84` remains only as a compatibility wrapper.

### `Function.txt`

Role: transformation notes and source-of-truth guidance.

Strengths:

- Documents that `universal-coordinate-converter.html` is the authoritative implementation.
- Summarizes all supported transformation flows without duplicating executable formulas.
- Describes the historical drift that was removed.

Concerns:

- No duplicate executable transformation code remains in this file.

### `README.md`

Role: user-facing project documentation.

Strengths:

- Clear overview and usage flow.
- Documents supported systems, import format, export formats, browser requirements, and offline limitations.
- Notes that map features require internet access.

Concerns:

- It states that GK to WGS84 uses a seven-parameter Helmert transformation, but the reverse WGS84-to-GK path uses a simpler reverse datum shift before GK projection.
- SWEREF99 examples now use coordinates near the EPSG:3011 area of use.
- It documents that KML export includes WGS84-to-target result rows.
- It documents accepted comment lines in TXT input.
- It warns that map visualization depends on the external map library and tiles.

### `rules.txt`

Role: development and publishing guidelines.

Strengths:

- Matches the project's major technical direction.
- Clearly requires English documentation, offline core calculations, built-in validation, known control-point testing, and repository cleanup.
- Documents that every functional update must be tested, committed, and pushed to GitHub.
- Project structure now matches the current filename and validation files.

Concerns:

- No major issue found after the follow-up update.

### `AGENTS.md`

Role: project instructions for AI/code contributors.

Strengths:

- Clear English-only policy.
- Clear local-browser and offline-core requirements.
- Correctly emphasizes built-in formulas and reference-point validation.

Concerns:

- No major issue found. It is consistent with the project direction.

### `LICENSE`

Role: MIT license.

Strengths:

- Standard MIT license text.
- Copyright year and author are present.

Concerns:

- No issue found.

### `.gitignore`

Role: excludes generated local files.

Current content:

- `*.kml`
- `*_converted.txt`
- `*_results_*.txt`
- `proj4-source.js`
- `proj4.js`
- `.DS_Store`
- `Thumbs.db`

Concerns:

- No major issue found after the follow-up update.

## Functional Audit

### Core Conversion Workflows

GK to WGS84:

- Input format: `PointID Easting Northing Height`
- Output: source coordinates, height, WGS84 latitude/longitude, Google Maps link.
- Basic validation exists.
- Results are sent to map and KML export.

WGS84 to target system:

- Input format: `PointID Latitude Longitude`
- Target options: GK or SWEREF99 18 00.
- Output changes table headers according to target.
- WGS84 source rows are included in map and KML export.
- GK conversion rejects coordinates outside a Germany-focused range.
- SWEREF99 conversion has no practical range warning.

SWEREF99 18 00 to WGS84:

- Input format: `PointID Easting Northing Height`
- Output: source coordinates, height, WGS84 latitude/longitude, Google Maps link.
- Basic validation exists.
- Results are sent to map and KML export.

Map:

- Initializes OpenLayers only when needed.
- Uses OpenStreetMap tiles.
- Displays GK-derived and SWEREF-derived WGS84 results.
- Does not display WGS84-to-target input or output points.

TXT export:

- Works through Blob URLs and should be available offline.
- Uses tab-separated headers.
- Filenames are derived from the relevant workflow's most recent imported file.

KML export:

- Exports point IDs and coordinates from selected result tables.
- Does not escape XML content.
- Uses generated filenames or the imported TXT base name.

## Mathematical Audit

### Positive Findings

- SWEREF99 forward/backward formulas are internally consistent in sampled round-trip checks.
- GK-to-WGS84 conversion produces plausible WGS84 output for the README GK sample.
- Coordinate calculations are built into the app, matching the no external calculation library policy.
- Browser math polyfills are present for older environments.

### Validation Performed

Informal formula checks were run by porting the active HTML formulas into a temporary Python calculation script. No authoritative geodetic library was installed in the environment, so these checks validate internal consistency rather than certified EPSG accuracy.

Sample results:

- WGS84 `55.12345678, 18.98765432` to SWEREF99 and back returned deltas of about `0.0000000054` degrees latitude and `0.0000000001` degrees longitude.
- WGS84 `59.3293, 18.0686` to SWEREF99 and back returned similarly small deltas.
- WGS84 `51.05031687, 9.971396507` to GK and back returned about `-0.00000666` degrees latitude and `0.00003076` degrees longitude drift, roughly meter-level to low-meter-level depending on latitude.
- README GK sample `3568189.267 5657692.868` converts to approximately WGS84 `51.050313, 9.971402`.
- README SWEREF sample `153905.093 6579354.449` converts to approximately WGS84 `59.329300, 18.068600`.

### Mathematical Risks

High risk: source-of-truth drift.

- Addressed in the follow-up update: `universal-coordinate-converter.html` is now the authoritative implementation, and `Function.txt` is documentation only.

High risk: insufficient authoritative validation.

- No automated tests compare results against official or independently verified control points.
- The current README examples are not enough to validate transformation accuracy.

Medium risk: asymmetric GK datum shift.

- HTML `pot2wgs` uses a seven-parameter transform.
- HTML `wgs2pot` uses a simpler reverse shift.
- This can create round-trip drift and should be reviewed against accepted accuracy requirements.

Medium risk: SWEREF99 range and examples.

- SWEREF99 18 00 is a projected CRS with practical geographic limits.
- The current app accepts broad values and can produce coordinates outside expected operational areas without warning.
- The README sample easting/northing appears inconsistent with the documented Sweden-focused use case.

## Security and Data Handling

High risk: unescaped HTML injection.

- `pointID` is inserted into table rows using template strings and `innerHTML`.
- A malicious TXT file could inject HTML into the page.
- Use `textContent` and DOM element creation, or escape values before insertion.

High risk: unescaped KML XML.

- `pointID` is written directly into `<name>`.
- Special XML characters can break KML output.
- Escape `&`, `<`, `>`, `"`, and `'` for XML output.

Medium risk: external dependencies have no integrity metadata.

- CDN scripts are loaded without Subresource Integrity.
- Consider vendoring optional libraries, adding SRI, or documenting the trust model.

Medium risk: file MIME validation may reject valid TXT files.

- Some browsers or operating systems may provide an empty MIME type for `.txt` files.
- Extension validation plus size checks may be more reliable for local workflows.

Low risk: Google Maps links open in a new tab without `rel`.

- Add `rel="noopener noreferrer"` to external links opened with `target="_blank"`.

## Offline and Dependency Audit

Works offline:

- Core coordinate calculations after the page is loaded.
- Manual input.
- TXT import/export.
- Basic table rendering.

Requires internet or cached CDN assets:

- OpenLayers.
- OpenStreetMap tiles.
- Google Maps external links.

Main issue:

- Map visualization now checks for OpenLayers before initializing and shows a clear message if the library is unavailable.

Recommendation:

- Keep feature checks in place before map actions that depend on CDN globals.
- Keep core conversions usable even when optional libraries fail.

## UI and Accessibility Audit

Strengths:

- Simple tabbed layout.
- Touch-friendly minimum height rules.
- Tables are horizontally scrollable on smaller screens.
- Textareas are readable and use monospace font.

Concerns:

- Tabs are semantic buttons with ARIA state and keyboard arrow navigation.
- Inline event attributes have been replaced with JavaScript event listeners.
- Error messages use `alert`, which is simple but disruptive for batch workflows.
- Toolbar and form inline styles have been moved into CSS classes.

Recommendations:

- Keep semantic tab behavior covered by validation tests.
- Continue moving larger UI behavior away from inline patterns as the app grows.
- Replace batch conversion alerts with an inline error summary panel while keeping alerts only for critical file failures.

## Documentation Audit

Documentation is generally understandable, but it needs better alignment with implementation details.

Recommended updates:

- Add exact supported TXT formats, including comment-line support.
- Keep README coverage for supported TXT formats, including comment-line support.
- Keep WGS84-to-target rows included in map/KML export.
- Keep offline fallback messaging for optional map features.
- Replace or verify the SWEREF99 example with a known control point.
- Document expected coordinate ranges for GK and SWEREF99 18 00.
- Keep `VALIDATION.md` updated with reference points, expected outputs, tolerances, and source of truth.
- Update `rules.txt` project structure to match the actual filename.

## Repository Hygiene Audit

Current concerns:

- `.gitignore` now matches the current generated-export policy.
- Generated-output ignores are too specific.
- A lightweight regression test suite is present in `tests/run_validation.py`, but official control-point validation is still needed.
- No version or release notes are present.

Recommended cleanup:

- Keep `.gitignore` aligned with generated export patterns.
- Keep `rules.txt` tracked as project guidance.
- Continue adding independently verified control points to `VALIDATION.md` when formula changes are planned.

## Priority Findings

### P1: Calculation Documentation Drift

Files:

- `universal-coordinate-converter.html`

Status:

- Partially addressed in the follow-up update. Tabs are buttons with ARIA state and keyboard support, inline event attributes were removed, and inline UI styles were moved into CSS classes. Inline conversion alerts remain for now.
- `Function.txt`
- `README.md`

Status:

- Addressed in the follow-up update. `Function.txt` is documentation only, and the HTML app is the implementation source of truth.

Impact:

- Maintainers cannot reliably know which formula set is authoritative.
- Future changes may copy outdated formulas.

Recommendation:

- Keep the HTML implementation as the current source of truth.
- Keep `Function.txt` as explanatory documentation with no duplicate executable code.
- Add official reference-point validation before changing formulas.

### P1: No Authoritative Reference Tests

Files:

- Project-wide

Status:

- Partially addressed. `VALIDATION.md` now records current regression baselines and limitations, but independently verified official control points are still recommended before formula changes.

Impact:

- Coordinate conversion accuracy cannot be confidently verified.

Recommendation:

- Create a validation table with known inputs and expected outputs for each conversion direction.
- Include tolerance thresholds.
- Test GK to WGS84, WGS84 to GK, SWEREF99 to WGS84, and WGS84 to SWEREF99.

### P1: Unescaped User Data in HTML and KML

Files:

- `universal-coordinate-converter.html`

Status:

- Addressed in the follow-up update. Result table cells use DOM text insertion, KML names are XML-escaped, and Google Maps links include `rel="noopener noreferrer"`.

Impact:

- Imported TXT data can inject HTML into result tables or break KML output.

Recommendation:

- Build table cells using `document.createElement` and `textContent`.
- Escape XML text before generating KML.

### P2: Optional CDN Features Fail Abruptly Offline

Files:

- `universal-coordinate-converter.html`
- `README.md`

Status:

- Addressed in the follow-up update. OpenLayers availability is checked before map initialization, and the README documents the map dependency.

Impact:

- The project promises local usability, but optional actions can fail without clear feedback.

Recommendation:

- Add dependency checks for `window.ol`.
- Show clear messages when unavailable.

### P2: Shared Import Filename State

Files:

- `universal-coordinate-converter.html`

Status:

- Addressed in the follow-up update. The app now tracks `lastGkImportFileName`, `lastWgsImportFileName`, and `lastSwerefImportFileName`.

Impact:

- Export filenames can be based on a file imported in another tab.

Recommendation:

- Track separate filename state per workflow:
  - `lastGkImportFileName`
  - `lastWgsImportFileName`
  - `lastSwerefImportFileName`

### P2: WGS84-to-Target Results Are Excluded from Map and KML

Files:

- `universal-coordinate-converter.html`
- `README.md`

Status:

- Addressed in the follow-up update. Map and KML export now collect WGS84 coordinates from all result tables, including WGS84-to-target rows.

Impact:

- Users may expect all converted points to be exportable/visualized.

Recommendation:

- Either include WGS84 input coordinates from WGS84-to-target rows in map/KML export, or document that map/KML export is only for WGS84 output rows from source-to-WGS84 conversions.

### P2: Repository Ignore Rules Are Inconsistent

Files:

- `.gitignore`
- `rules.txt`

Status:

- Addressed in the follow-up update. `.gitignore` now uses broader generated-export patterns, and `rules.txt` describes the current tracked project structure.

Impact:

- Development artifacts and generated files may continue to enter version control.

Recommendation:

- Keep `.gitignore` and `rules.txt` aligned as export behavior changes.

### P3: Accessibility and Maintainability

Files:

- `universal-coordinate-converter.html`

Impact:

- Keyboard users and assistive technology users get a weaker tab experience.
- Inline handlers make the app harder to maintain.

Recommendation:

- Replace clickable `div` tabs with buttons.
- Move event handlers to `addEventListener`.
- Add basic ARIA tab state or use a simpler button-controlled panel design.

## Suggested Implementation Roadmap

Phase 1: correctness and safety.

- Add reference-point validation data.
- Keep `VALIDATION.md` updated with reference-point validation data.
- Keep `Function.txt` reconciled with the live implementation policy.
- Escape table and KML output.
- Add dependency checks for map features.

Phase 2: workflow consistency.

- Fix per-tab filename state.
- Decide whether WGS84-to-target results belong in map/KML export.
- Update README with exact behavior and examples.
- Keep the `convertSwerfToWGS84` compatibility wrapper until old local copies are no longer relevant.

Phase 3: repository and UI cleanup.

- Keep `.gitignore` updated with generated-output patterns.
- Continue improving error-summary UX for batch conversion errors.

## Recommended Validation Cases

Create a small validation table covering:

- GK easting/northing to WGS84 latitude/longitude for a known German control point.
- WGS84 latitude/longitude to GK easting/northing for the same point.
- SWEREF99 18 00 easting/northing to WGS84 for a known Swedish control point.
- WGS84 latitude/longitude to SWEREF99 18 00 for the same point.
- Invalid text row.
- Missing height row.
- Comment and blank lines.
- Boundary coordinates outside accepted GK range.
- File import with `.txt` extension and empty MIME type.

Each case should include:

- Input line.
- Expected output.
- Accepted tolerance.
- Source of expected value.
- Whether the case should pass or fail.

## Final Assessment

The project has a good foundation: it is simple to open locally, useful for real coordinate conversion workflows, and mostly aligned with the stated requirement to keep core calculations offline. The next major step is to make correctness auditable. Once the formula source of truth, reference tests, and output escaping are fixed, the app will be much easier to maintain and safer to use with real imported field data.
