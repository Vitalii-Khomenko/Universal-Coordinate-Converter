# Validation Notes

The current test suite is a regression suite for the maintained implementation
in `index.html`, `css/`, and `js/`. It also protects the stable root-level
standalone release and rebuilds the generated portable HTML in `dist/`.

The suite also protects strict input parsing: coordinate and height fields must
contain digits with one optional decimal point. `PointID` remains free text
and may contain spaces when the importer can identify the following coordinate
pair. Missing GK or SWEREF99 heights are normalized to `0.000`.

Interface invariants protect the GeoMonitoring design standard, including the
source/result workspace structure, guided sample loading, result empty states,
44px control targets, shared design tokens, English terminology, and map
resizing after a hidden panel becomes visible.

Run validation with:

```bash
python tests/run_validation.py
```

## Current Regression Cases

| Direction | Input | Expected output | Tolerance |
| --- | --- | --- | --- |
| GK to WGS84 | `3568189.267 5657692.868` | Latitude `51.0503134303347`, longitude `9.971401877600515` | `1e-8` degrees |
| WGS84 to GK | Latitude `51.05031687`, longitude `9.971396507` | Easting `3568191.052`, northing `5657692.533` | exact string after 3-decimal formatting |
| SWEREF99 to WGS84 | `153905.093 6579354.449` | Latitude `59.32930000483974`, longitude `18.068600003456346` | `1e-8` degrees |
| Legacy SWEREF99 regression | `674189.267 6557692.868` | Latitude `58.81452667561076`, longitude `27.089317460770403` | `1e-8` degrees |
| WGS84 to SWEREF99 | Latitude `55.12345678`, longitude `18.98765432` | Easting `213008.7865462337`, northing `6111419.641371732` | `0.001` meters |
| SWEREF99 round trip | Latitude `59.3293`, longitude `18.0686` | Same WGS84 coordinate after project/unproject | `1e-7` degrees |
| GK out-of-range guard | Latitude `59.3293`, longitude `18.0686` | Empty GK result | exact |

## Non-Mathematical Project Checks

The suite also checks that:

- Core conversion functions remain in `js/transformations.js` and in the
  stable standalone HTML app.
- The split source loads local CSS and JavaScript in the required order.
- The builder creates a portable HTML file without modifying the stable
  root-level field release.
- No external calculation library such as `proj4` is used by the app.
- Project text files contain no Cyrillic text.
- The README documents the test command.
- Safe output helpers are present for table and KML generation.
- Map dependency checks are present.
- TXT import recognizes multi-part point IDs and optional projected-coordinate heights.
- TXT cleanup removes comments, blank lines, unrecognized rows, and trailing fields.
- The app uses event listeners instead of inline event attributes.
- The tabs expose semantic tab roles for better keyboard and screen-reader behavior.
- The project rules require push-to-GitHub after functional updates.

## Important Limitation

These are regression baselines, not official geodetic control points. Before
changing transformation formulas, add independently verified reference points
from an authoritative source and document the source, expected value, and
accepted tolerance here.

## Field Validation Note

The project owner has manually checked the converter output against actual
field locations over several months of real use and reports that the resulting
positions match the expected physical locations. This practical field history is
an important confidence signal for the current formulas. It should be preserved
as context, while future formula changes should still be backed by authoritative
control-point fixtures.
