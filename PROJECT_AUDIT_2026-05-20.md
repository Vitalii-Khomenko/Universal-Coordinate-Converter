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

The main risks are mathematical traceability, documentation drift, unescaped dynamic output, dependency resilience, and repository hygiene. The application is functional in concept, but the transformation code and `Function.txt` are not fully synchronized, some examples appear inconsistent with the supported coordinate systems, and the current automated tests are regression checks rather than authoritative geodetic control-point validation.

## Overall Rating

Status: usable prototype with important correctness and hardening work still needed.

Priority areas:

1. Add authoritative reference-point tests for all conversion directions.
2. Reconcile `Function.txt` with the actual formulas in `universal-coordinate-converter.html`.
3. Escape user-provided values before writing table rows or KML.
4. Improve offline fallback behavior for optional CDN features.
5. Clean repository state and align `.gitignore` with `rules.txt`.

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
- Several result rows are built with `innerHTML` using unescaped user-provided `pointID` values.
- Map features assume CDN globals exist and can fail with unclear errors offline.
- One global `lastImportedTxtFileName` is shared across all import workflows, which can cause exports in one tab to inherit a filename from another tab.
- WGS84 target-system result rows are not included in map or KML export because those workflows only collect WGS84 coordinates from the GK-to-WGS84 and SWEREF-to-WGS84 result tables.
- The function name `convertSwerfToWGS84` contains a spelling error and should be renamed to `convertSwerefToWGS84` with compatibility retained if needed.

### `Function.txt`

Role: mathematical algorithm documentation / extracted function reference.

Strengths:

- Contains English comments and documents the intended formulas.
- Covers all core conversion directions.

Concerns:

- It is not synchronized with the live HTML implementation.
- The GK datum transformation parameters differ between `Function.txt` and the HTML file.
- The WGS84-to-SWEREF99 implementation differs from the HTML file.
- Because this file looks like source code, future maintainers may trust it as authoritative even when it no longer matches the app.

### `README.md`

Role: user-facing project documentation.

Strengths:

- Clear overview and usage flow.
- Documents supported systems, import format, export formats, browser requirements, and offline limitations.
- Notes that map features require internet access.

Concerns:

- It states that GK to WGS84 uses a seven-parameter Helmert transformation, but the reverse WGS84-to-GK path uses a simpler reverse datum shift before GK projection.
- The sample SWEREF99 input `674189.267 6557692.868` converts to approximately latitude `58.814527`, longitude `27.089317` with the current implementation, which is far east of the SWEREF99 18 00 central meridian use case shown elsewhere.
- It does not document that KML export currently excludes WGS84-to-target results.
- It does not document accepted comment lines in TXT input.
- It does not warn that map features can fail when CDN scripts are unavailable.

### `rules.txt`

Role: development and publishing guidelines.

Strengths:

- Matches the project's major technical direction.
- Clearly requires English documentation, offline core calculations, built-in validation, known control-point testing, and repository cleanup.

Concerns:

- It says `rules.txt` should be excluded by `.gitignore`, but `rules.txt` is tracked.
- It says published essentials are HTML, `Function.txt`, `README.md`, and `.gitignore`, but the repository also includes project instructions and license files. The license is useful and should probably remain, so the guideline needs updating.
- The expected main file name in the example is `coordinate-transformer.html`, while the actual main file is `universal-coordinate-converter.html`.

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

- `92007690.kml`
- `92007690.txt`
- `92007721_iGM.kml`
- `92007721_iGM.txt`
- `proj4-source.js`
- `proj4.js`

Concerns:

- It does not ignore `rules.txt`, despite `rules.txt` saying it should be excluded.
- It only ignores specific generated TXT/KML filenames instead of broader generated-output patterns.
- It ignores `proj4` files, which is good if they are accidental external calculation dependencies, but the reasoning is not documented.

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
- Results are not currently included in map or KML export.
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
- Filenames are derived from the most recent imported file, but that state is shared globally across tabs.

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
- README SWEREF sample `674189.267 6557692.868` converts to approximately WGS84 `58.814527, 27.089317`.

### Mathematical Risks

High risk: source-of-truth drift.

- `Function.txt` and `universal-coordinate-converter.html` contain different implementations for key transformations.
- The live app should have one authoritative calculation source, or the documentation should be generated from the same source.

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

- Optional online features do not degrade gracefully. If CDN scripts are unavailable, clicking map-related buttons can throw runtime errors instead of showing a clear message.

Recommendation:

- Add feature checks before map/export actions that depend on CDN globals.
- Display clear English messages when the required map library did not load.
- Keep core conversions usable even when optional libraries fail.

## UI and Accessibility Audit

Strengths:

- Simple tabbed layout.
- Touch-friendly minimum height rules.
- Tables are horizontally scrollable on smaller screens.
- Textareas are readable and use monospace font.

Concerns:

- Tabs are `div` elements with click handlers instead of semantic buttons.
- Inline `onclick` handlers reduce maintainability.
- There is no keyboard tablist behavior or ARIA state for active tabs.
- Error messages use `alert`, which is simple but disruptive for batch workflows.
- The map toolbar has inline styles and may become cramped on small screens.

Recommendations:

- Convert tabs to `<button>` elements.
- Add `aria-selected`, `aria-controls`, and keyboard navigation if keeping a tab interface.
- Move inline styles into CSS.
- Replace batch conversion alerts with an inline error summary panel while keeping alerts only for critical file failures.

## Documentation Audit

Documentation is generally understandable, but it needs better alignment with implementation details.

Recommended updates:

- Add exact supported TXT formats, including comment-line support.
- Clarify that WGS84-to-target results are not currently map/KML export sources, or change the app so they are included.
- Add offline fallback behavior for optional features.
- Replace or verify the SWEREF99 example with a known control point.
- Document expected coordinate ranges for GK and SWEREF99 18 00.
- Add a validation section with reference points, expected outputs, tolerances, and source of truth.
- Update `rules.txt` project structure to match the actual filename.

## Repository Hygiene Audit

Current concerns:

- `.gitignore` does not match `rules.txt`.
- Generated-output ignores are too specific.
- A lightweight regression test suite is present in `tests/run_validation.py`, but official control-point validation is still needed.
- No version or release notes are present.

Recommended cleanup:

- Update `.gitignore` with broader patterns such as `*.kml` and generated result TXT patterns.
- Decide whether `rules.txt` should remain tracked. If yes, update `rules.txt` so it no longer says to exclude itself.
- Add a `test-cases.md` or `validation.md` with authoritative reference points and expected tolerances.

## Priority Findings

### P1: Calculation Documentation Drift

Files:

- `universal-coordinate-converter.html`
- `Function.txt`
- `README.md`

Impact:

- Maintainers cannot reliably know which formula set is authoritative.
- Future changes may copy outdated formulas.

Recommendation:

- Make the HTML implementation the current source of truth.
- Update `Function.txt` to exactly match it, or convert `Function.txt` into explanatory documentation with no duplicate executable code.
- Add reference-point validation before changing formulas.

### P1: No Authoritative Reference Tests

Files:

- Project-wide

Impact:

- Coordinate conversion accuracy cannot be confidently verified.

Recommendation:

- Create a validation table with known inputs and expected outputs for each conversion direction.
- Include tolerance thresholds.
- Test GK to WGS84, WGS84 to GK, SWEREF99 to WGS84, and WGS84 to SWEREF99.

### P1: Unescaped User Data in HTML and KML

Files:

- `universal-coordinate-converter.html`

Impact:

- Imported TXT data can inject HTML into result tables or break KML output.

Recommendation:

- Build table cells using `document.createElement` and `textContent`.
- Escape XML text before generating KML.

### P2: Optional CDN Features Fail Abruptly Offline

Files:

- `universal-coordinate-converter.html`
- `README.md`

Impact:

- The project promises local usability, but optional actions can fail without clear feedback.

Recommendation:

- Add dependency checks for `window.ol`.
- Show clear messages when unavailable.

### P2: Shared Import Filename State

Files:

- `universal-coordinate-converter.html`

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

Impact:

- Users may expect all converted points to be exportable/visualized.

Recommendation:

- Either include WGS84 input coordinates from WGS84-to-target rows in map/KML export, or document that map/KML export is only for WGS84 output rows from source-to-WGS84 conversions.

### P2: Repository Ignore Rules Are Inconsistent

Files:

- `.gitignore`
- `rules.txt`

Impact:

- Development artifacts and generated files may continue to enter version control.

Recommendation:

- Reconcile `.gitignore` and `rules.txt`.

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
- Reconcile `Function.txt` with the live implementation.
- Escape table and KML output.
- Add dependency checks for map features.

Phase 2: workflow consistency.

- Fix per-tab filename state.
- Decide whether WGS84-to-target results belong in map/KML export.
- Update README with exact behavior and examples.
- Rename `convertSwerfToWGS84` while preserving compatibility.

Phase 3: repository and UI cleanup.

- Update `.gitignore`.
- Improve semantic tabs and keyboard support.
- Move inline styles and event handlers into structured CSS/JS sections.

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
