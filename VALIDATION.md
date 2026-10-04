# Validation Notes

The current test suite is a regression suite for the maintained implementation
in `index.html`, `css/`, `js/`, and the vendored front end in `shared/`. It also
protects the root-level standalone field release and rebuilds the generated
portable HTML in `dist/`.

The suite also protects strict input parsing: coordinate fields must contain
digits with one optional decimal point, and heights additionally allow a leading
minus (for example `-5.200`). `PointID` remains free text and may contain spaces
when the importer can identify the following coordinate pair. WGS84 rows are
recognized by a latitude and longitude pair in the practical area (latitude 45
to 72, longitude 4 to 32), so numeric parts of a point ID such as
`Station 12` are preserved. Missing GK or SWEREF99 heights are normalized to
`0.000`.

Interface invariants protect the GeoField design: the shared header and footer,
GeoField glyphs and tone, the source/result panel structure, guided sample
loading, result empty states, English terminology, and map resizing after a
hidden panel becomes visible. They also protect native hidden states and check
that the vendored front end in `shared/` makes no remote requests.

When Node.js is installed, `tests/js_behavior_checks.js` runs the shipped
`js/transformations.js` and `js/app.js` in a VM with a minimal DOM stub. It checks
the regression baselines, negative heights, WGS84 point IDs with numeric parts,
TXT normalization, and XML escaping against the real code instead of the Python
mirrors. Without Node.js those checks are skipped and the Python mirrors still run.

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
  standalone HTML app.
- The split source loads the shared and local CSS and JavaScript in the required
  order.
- The builder creates the generated portable HTML file and the root-level field
  release with inlined CSS, JavaScript, fonts, and favicon.
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

## Manual Check Before Release

1. Open the field release in a desktop browser and on a phone.
2. Convert the three sample rows and compare them with the baselines above.
3. Import a TXT file with comments, a multi-part ID, a negative height, and a
   missing height, and read the import status message.
4. Convert WGS84 points to GK, then change the target dropdown and export TXT
   without converting again: the file must still describe GK.
5. Open the map tab with points from Germany and Sweden: all points must be
   in view.

## Field Validation Note

The project owner has manually checked the converter output against actual
field locations over several months of real use and reports that the resulting
positions match the expected physical locations. This practical field history is
an important confidence signal for the current formulas. It should be preserved
as context, while future formula changes should still be backed by authoritative
control-point fixtures.
