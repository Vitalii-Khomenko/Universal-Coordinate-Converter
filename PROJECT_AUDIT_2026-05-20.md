# Universal Coordinate Converter Audit

Date: 2026-05-20

## Scope

This audit covers the local browser application, documentation, validation suite, project rules, repository hygiene, import/export behavior, map integration, and coordinate transformation risk.

Reviewed project files:

- `universal-coordinate-converter.html`
- `README.md`
- `Function.txt`
- `VALIDATION.md`
- `tests/run_validation.py`
- `rules.txt`
- `AGENTS.md`
- `.gitignore`
- `LICENSE`

## Current Status

The project is a usable standalone coordinate conversion tool. The main application remains a single HTML file that can be opened directly in a browser, and core coordinate calculations remain offline and formula-based.

The active transformation formulas are intentionally preserved in `universal-coordinate-converter.html`. `Function.txt` is documentation only and does not duplicate executable formula code.

## Closed Audit Items

- Removed obsolete generated-output references from project files.
- Removed the retired document-export workflow and related project references.
- Added `.gitignore` patterns for generated TXT and KML exports.
- Preserved the app as a local browser tool without introducing a backend.
- Kept coordinate formulas in the application file as the implementation source of truth.
- Added regression validation for GK, WGS84, and SWEREF99 conversion paths.
- Documented current regression baselines and validation limits in `VALIDATION.md`.
- Documented that official geodetic control points are required before changing formulas.
- Escaped user-provided point IDs in table output and KML export.
- Replaced unsafe result-row HTML construction with DOM text insertion.
- Added a map dependency guard for the optional OpenLayers feature.
- Kept TXT import limited to `.txt` files and 5 MB input size.
- Tracked imported filenames separately for GK, WGS84, and SWEREF99 workflows.
- Included WGS84-to-target rows in map and KML export.
- Corrected the SWEREF conversion handler name while keeping a compatibility wrapper.
- Replaced inline event handlers with JavaScript event listeners.
- Converted tabs to semantic buttons with ARIA state and keyboard navigation.
- Updated README examples so GK and SWEREF99 formats are clearly separated.
- Added inline conversion feedback for batch errors and warnings.
- Added practical-area warnings for SWEREF99 18 00 without blocking calculation.
- Documented the rule that functional updates must be tested, committed, and pushed to GitHub.

## Remaining Risks

1. **Authoritative control points**

   The current validation suite protects existing behavior, but it still depends on regression baselines from the current implementation. Formula changes should wait until authoritative external control points are added.

2. **Formula traceability**

   The formulas are documented at a high level, but the project still needs source citations or control-point references for each supported coordinate system.

3. **Optional map dependency**

   Core conversion works offline. Map visualization still depends on the external OpenLayers library and map tiles.

4. **Legacy compatibility wrapper**

   `convertSwerfToWGS84` remains as a compatibility wrapper for older saved local copies. It can be removed in a later breaking cleanup if no external local copies depend on it.

## Validation Status

Current validation command:

```bash
python tests/run_validation.py
```

The suite checks:

- GK to WGS84 regression behavior.
- WGS84 to GK regression behavior.
- SWEREF99 18 00 to WGS84 regression behavior.
- WGS84 to SWEREF99 regression behavior.
- SWEREF round-trip stability.
- GK out-of-range rejection behavior.
- English-only project text.
- Required project files.
- Absence of external calculation libraries.
- Safe output helper usage.
- Map dependency guard.
- Event-listener based UI wiring.
- Inline conversion feedback.
- Documentation and validation policy invariants.

## Next Recommended Work

1. Add authoritative external control-point fixtures for every conversion direction.
2. Add a small manual browser checklist for smartphone use after UI changes.
3. Decide whether to keep or remove the legacy SWEREF compatibility wrapper.
4. Consider vendoring the optional map library only if offline map startup becomes a project goal.

## Audit Conclusion

The project is in a cleaner and safer state than the original audit baseline. The remaining work is mostly about formal mathematical verification and optional dependency resilience, not immediate application breakage.
