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
- KML export for Google Earth.
- Map visualization (OpenLayers, OpenStreetMap tiles; requires internet).
- Google Maps links for each point.
- Dynamic table headers and export filenames.
- Inline input validation feedback for batch conversion errors and range warnings.
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

1. Open `universal-coordinate-converter.html` in your browser (no installation needed).
2. Select the desired tab:
   - **Gauß-Krüger → WGS84**
   - **WGS84 → GK or SWEREF99** (dropdown)
   - **SWEREF99 18 00 → WGS84**
   - **Map** (visualize/export points)
3. Enter data manually or import TXT file.
4. Select target system if needed.
5. Click **Convert** and export results as TXT or KML.

Conversion feedback appears below the active form. Rows with valid data are still converted when other rows contain input errors.

## Input Data Format

**Gauß-Krüger to WGS84:**
```
PointID Easting Northing Height
1029 3568189.267 5657692.868 321.609
```

**SWEREF99 18 00 to WGS84:**
```
PointID Easting Northing Height
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

## System Requirements

- Modern browser (Chrome, Firefox, Edge, Safari)
- JavaScript enabled
- Internet required for map visualization
- TXT import up to 5MB

## Coordinate Range Notes

- GK output is limited to the Germany-focused range used by the app.
- SWEREF99 18 00 is intended for eastern Sweden around the 18°E central meridian.
- Coordinates outside these practical areas may still calculate, but the app shows a warning and the result should be checked against authoritative control points before field use.

## Project Structure

- `universal-coordinate-converter.html` — main application (all functions in one file)
- `Function.txt` — transformation notes; the HTML file is the implementation source of truth
- `VALIDATION.md` — regression baselines and validation policy
- `tests/run_validation.py` — regression validation suite
- `README.md` — this documentation

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
- Standard geodetic formulas for all conversions
- Input validation with range warnings for SWEREF99 18 00 practical-area checks
- No installation or server required; runs in browser

## Testing

Run the validation suite with:
```
python tests/run_validation.py
```

The suite checks current coordinate-regression baselines and project invariants without external dependencies. See `VALIDATION.md` for the current baselines and the limitation that official geodetic control points are still recommended before changing transformation formulas.

## License

MIT License

## Contributing

Feel free to submit issues or pull requests to improve accuracy or add new systems.

---

*For questions or suggestions, contact the project author.*
