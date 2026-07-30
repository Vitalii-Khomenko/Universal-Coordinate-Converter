# Mission: Universal Coordinate Converter

## 1. Project Purpose

Universal Coordinate Converter is a local-first browser tool for field and
office coordinate conversion. It must remain quick to open, understandable,
and usable without installing software or running a server.

The primary goals are:

- Convert Gauß-Krüger (Bessel/Potsdam), WGS84, and SWEREF99 18 00 coordinates.
- Preserve the established transformation behavior and documented regression
  baselines.
- Process coordinate lists locally through manual entry or TXT import.
- Export reusable TXT and KML results.
- Keep core conversions available without an internet connection.
- Provide touch-friendly workflows on smartphone and laptop browsers.

## 2. Architecture

### Editable source

The maintained application is split into:

- `index.html` for document structure and controls.
- `css/style.css` for responsive presentation.
- `js/transformations.js` for geodetic formulas and compatibility helpers.
- `js/app.js` for parsing, validation, UI behavior, import/export, and maps.

The files use browser globals intentionally so `index.html` can run directly
from the filesystem without a package manager, bundler, or local server.

### Portable build

`scripts/build_singlefile_dist.py` inlines the local CSS and JavaScript into
`dist/universal-coordinate-converter.generated.html`. The generated file is
the portable release candidate. The root-level
`universal-coordinate-converter.html` remains the stable historical field
release and is not overwritten by the builder.

### Offline boundary

All parsing, validation, conversion, TXT import/export, clipboard support, and
KML creation are local browser operations. OpenLayers is loaded from a CDN only
for the optional map tab. A failed map dependency must not prevent coordinate
conversion.

## 3. Functional Scope

### Gauß-Krüger and WGS84

The tool converts Gauß-Krüger coordinates through the Bessel/Potsdam formulas
and the established datum shift. Reverse conversion applies the corresponding
live WGS84-to-Potsdam behavior before projection.

### SWEREF99 18 00 and WGS84

Forward and inverse Transverse Mercator formulas use the GRS80 ellipsoid,
18-degree central meridian, scale factor `1.0`, false easting `150000.0`, and
false northing `0.0`.

### Input and output

- Point IDs are free text and may contain spaces.
- Coordinate values use a decimal point.
- Projected-coordinate height is optional and defaults to `0.000`.
- Blank lines and `#` or `//` comments are ignored.
- TXT import accepts whitespace, tabs, semicolons, and vertical bars.
- Result tables can be copied or exported as TXT.
- WGS84 results can be visualized and exported as KML.

## 4. Safety and Quality

- Imported point IDs must be inserted with text-safe DOM methods.
- KML text must be XML-escaped.
- Files remain in the active browser session and are not uploaded.
- Transformation changes require known reference-point regression coverage.
- The validation suite must rebuild and inspect the generated single-file app.
- Project text, comments, documentation, and UI copy must remain in English.

## 5. Definition of Done

A functional update is complete only when:

1. Source and portable-build behavior remain aligned.
2. Documentation describes the changed behavior.
3. `python tests/run_validation.py` passes.
4. The generated file is rebuilt successfully.
5. The change is committed and pushed to GitHub.
