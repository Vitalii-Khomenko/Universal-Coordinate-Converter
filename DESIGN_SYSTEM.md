# GeoField interface

The converter is a page of the GeoField section of Airwitech. It uses the same
design as the GeoField application (the Field Checker web pages): a dark ink
surface with violet, amber, and cyan tones, square pixel motifs instead of
rounded corners, thin hairlines, Sora and Source Sans type, and a falling-pixel
meteor field behind the content. The light theme follows the system setting and
can be switched with the square toggle in the header; only the chosen theme is
stored in the browser.

## Files

| File | Purpose |
| --- | --- |
| `shared/site.css` | Tokens, themes, header, hero, footer (GeoField copy) |
| `shared/app.css` | Panels, forms, tabs, buttons, tables, chips, print rules (GeoField copy) |
| `shared/site.js` | Theme toggle, meteor field, hero pixel glyphs, scroll rail (GeoField copy) |
| `shared/fonts/` | Sora (variable) and Source Sans 3 (400, 600), self-hosted |
| `shared/favicon.svg` | The pixel-trail mark |
| `css/style.css` | Converter-only additions: four-button tab row, workspace grid, status messages, empty states, map |

The files in `shared/` are copies from the Field Checker repository
(`web/static`). Do not edit them here; copy updated versions and keep
converter-specific rules in `css/style.css`.

## Page structure

1. Shared header: the `airwitech | geofield` wordmark (one link to
   `https://airwitech.com/`), then Study, SNN Robots, GeoField (current page),
   About, and the theme toggle.
2. Compact hero: eyebrow, two-line headline (the second line in the accent
   colour), lede, and a row of three numbered step cards. The pixel glyphs are
   the GeoField set: `antenna`, `network`, and `tripod`.
3. Tab row (`.tabs`): four numbered workflow buttons with the colour line of the
   selected tab.
4. Panels (`.panel` with `.panel-head`): source data on the left, output on the
   right; the map is one full-width panel.
5. Shared footer: `airwitech geofield`, the common link row, and a legal note.

There is no separate "back to the main site" button; the wordmark and the
Airwitech links do that.

## Rules

- One cyan accent on every GeoField page (`body.tone-gnss`). Violet and amber
  appear on panels and step cards only; alert red is reserved for failures.
- Colour never carries meaning alone: statuses are written out ("Converted: 2 |
  Errors: 0 | Warnings: 0").
- Fonts are referenced relative to the stylesheet and embedded as data URIs in
  the single-file build. The only external resources are the optional map
  library (jsDelivr) and map tiles (Esri, with OpenStreetMap as a fallback).
- Every page works from 320 px, is keyboard accessible with visible focus, and
  the meteor field is a still frame under `prefers-reduced-motion`.
- Wide tables scroll inside their panel; the page never scrolls sideways. On
  phones the table shows a "Swipe table horizontally" hint.
- Controls keep touch-friendly sizes. Empty result panels explain the next step,
  and copy or download actions stay disabled until results exist.
- Printing hides navigation and effects and switches to a light palette.

## Integration into the GeoField site

Use the GeoField site's own header, footer, and stylesheets. Take the content of
`<main>` from `index.html`, add `css/style.css` after `shared/app.css`, and load
`js/transformations.js` and `js/app.js` after the shared script. Keep the element
IDs: `js/app.js` finds every control by ID.
