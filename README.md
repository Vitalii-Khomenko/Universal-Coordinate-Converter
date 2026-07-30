# Universal Coordinate Converter

Web-based tool for converting coordinates between supported systems, with map visualization, TXT import/export, and KML export.

## Supported Coordinate Systems

- **Gauß-Krüger (Bessel, Potsdam)** ↔ **WGS84** (Germany)
- **SWEREF99 18 00 (EPSG:3011)** ↔ **WGS84** (Sweden)
- **WGS84** → **Gauß-Krüger (GK)** or **SWEREF99 18 00** (dropdown)
*Each direction is available as a separate function/tab.*

## Features

- All coordinate transformations are performed in-browser using built-in geodetic algorithms.
- WGS84 can be converted to GK or SWEREF99 (dropdown selection).
- TXT file import/export for batch processing.
- Copy result tables to the clipboard.
- KML export for Google Earth.
- Map visualization (OpenLayers, OpenStreetMap tiles; requires internet).
- Google Maps links for each point.
- Dynamic table headers and export filenames.
- Inline input validation feedback with compact conversion, error, and warning counts.
- Strict numeric validation rejects letters, commas, and mixed text in coordinate fields.
- Tolerant TXT cleanup recognizes multi-part point IDs, removes non-data lines and trailing fields, and supplies `0.000` when projected-coordinate height is missing.
- KML export includes WGS84 coordinates from all result tables, including WGS84-to-target input rows.
- Imported point IDs are written safely to tables and KML output.
- Polyfills for legacy browser math functions.

*Map visualization requires internet for external libraries and map tiles.*

## Mathematical Details

- **GK (Bessel/Potsdam) to WGS84**: GK inverse projection followed by the live DHDN/Potsdam datum shift.
- **WGS84 to GK**: Reverse datum shift followed by GK projection.
- **SWEREF99 18 00 ↔ WGS84**: Transverse Mercator projection formulas on the GRS80 ellipsoid.
- Polyfills for legacy browser compatibility (Math.cosh, Math.sinh, Math.atanh, Math.asinh)

## Usage

1. Open `index.html` with the repository folders intact, or open
   `dist/universal-coordinate-converter.generated.html` as a portable file.
2. Select the desired tab:
   - **Gauß-Krüger → WGS84**
   - **WGS84 → GK or SWEREF99** (dropdown)
   - **SWEREF99 18 00 → WGS84**
   - **Map** (visualize/export points)
3. Enter data manually or import TXT file.
4. Select target system if needed.
5. Click **Convert** and export results as TXT or KML.

Conversion feedback appears below the active form. Rows with valid data are still converted when other rows contain input errors.
Each conversion tab includes a visible sample line and a **Copy Results** button for quick reuse of converted table data.

## Input Data Format

**Gauß-Krüger to WGS84:**
```
PointID Easting Northing [Height]
1029 3568189.267 5657692.868 321.609
```

**SWEREF99 18 00 to WGS84:**
```
PointID Easting Northing [Height]
1029 153905.093 6579354.449 0.000
```

**WGS84 to Target System:**
```
PointID Latitude Longitude
1029 51.05031687 9.971396507
1030 55.12345678 18.98765432
```

*Target system (GK or SWEREF99) is selected via dropdown.*

Blank lines and lines starting with `#` or `//` are ignored during import and conversion.
During TXT import, comment lines, blank lines, and unrecognized headers are removed from the input area. Whitespace, tabs, semicolons, and vertical bars are accepted as field separators. The importer identifies plausible coordinate pairs, so multi-part point IDs such as `HP 14-1` are preserved. Trailing fields after the supported values are removed.

Height is optional for GK and SWEREF99 input. A missing height is normalized to `0.000`; height is retained for output but does not affect the horizontal transformation. The import status reports recognized records, removed non-data lines, defaulted heights, preserved multi-part IDs, and removed trailing fields.

Coordinate and height fields must contain digits with one optional decimal point, for example `3568189.267`. Decimal commas and mixed text inside numeric fields are not accepted.

## System Requirements

- Modern browser (Chrome, Firefox, Edge, Safari)
- JavaScript enabled
- Internet required for map visualization
- TXT import up to 5MB

## Coordinate Range Notes

- GK output is limited to the Germany-focused range used by the app.
- SWEREF99 18 00 is intended for eastern Sweden around the 18°E central meridian.
- Coordinates outside these practical areas may still calculate, but the app shows a warning and the result should be checked against authoritative control points before field use.

## Accuracy Notes

The project owner has manually checked the current converter output against actual field locations over several months of real use and reports that the positions match the expected physical locations. The automated suite preserves the current formula behavior with regression tests; authoritative control points are still recommended before changing transformation formulas.

## Project Structure

```text
index.html                                  — editable application structure
css/style.css                               — responsive styles
js/transformations.js                       — coordinate formulas and math helpers
js/app.js                                   — parsing, UI, import/export, and maps
universal-coordinate-converter.html         — stable standalone field release
dist/universal-coordinate-converter.generated.html
                                            — generated portable application
scripts/build_singlefile_dist.py            — portable-build script
Mission.md                                  — product and architecture mission
SECURITY.md                                 — privacy, security, and deployment policy
Function.txt                                — transformation notes
VALIDATION.md                               — regression baselines and validation policy
tests/run_validation.py                     — regression and structure checks
AGENTS.md                                   — project instructions for coding agents
rules.txt                                   — development and publishing rules
LICENSE                                     — MIT license
```

The split source uses plain browser scripts and can be opened directly without
Node, a package manager, or a local server. The builder writes only to `dist/`
and does not overwrite the stable root-level field release.

## Performance

- Most functions work offline (except map visualization)
- Handles TXT files up to 5MB
- Uses CDN libraries for map features

## Technical Notes

- UI: Tabs for each conversion direction, dropdown for WGS84 target
- Table headers and export filenames adjust to selected system
- Each conversion workflow keeps its own imported TXT filename for exports
- KML export includes points from GK-to-WGS84, SWEREF99-to-WGS84, and WGS84-to-target results
- Map controls show a clear message if the external map library is unavailable
- Batch conversion feedback is shown inline instead of interrupting smartphone workflows with conversion-error popups
- TXT import normalizes recognized coordinate records before conversion and reports all cleanup decisions
- Coordinate input is parsed strictly, so mixed values such as `35634d49.97359` are rejected instead of being partially converted
- Result tables are horizontally scrollable on small screens
- Standard geodetic formulas for all conversions
- Input validation with range warnings for SWEREF99 18 00 practical-area checks
- No installation or server required; runs in browser

## Privacy and Security

- Coordinate data and imported TXT files are processed locally in the browser.
- The app does not intentionally upload files, use analytics, or store data in
  a remote service.
- OpenLayers and map tiles are the only optional network-dependent features.
- Imported point IDs use text-safe DOM output, and KML names are XML-escaped.
- A Content Security Policy limits scripts, styles, connections, objects, and
  form actions.

See `SECURITY.md` for supported deployment and reporting guidance.

## Testing

Run the validation suite with:
```
python tests/run_validation.py
```

The suite checks current coordinate-regression baselines and project invariants without external dependencies. See `VALIDATION.md` for the current baselines and the limitation that official geodetic control points are still recommended before changing transformation formulas.

The suite also runs the portable builder and verifies that the generated file
contains the local CSS and JavaScript while leaving the stable standalone file
unchanged.

Build the portable single-file application manually with:

```bash
python scripts/build_singlefile_dist.py
```

The output is written to
`dist/universal-coordinate-converter.generated.html`.

## License

MIT License

## Contributing

Feel free to submit issues or pull requests to improve accuracy or add new systems.

---

*For questions or suggestions, contact the project author.*
