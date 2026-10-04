# Shared GeoField front end

These files are copies of the GeoField front end from the Field Checker
repository (`web/static`, source commit `f99ee33`). They give this tool the same
header, footer, themes, fonts, panels, tabs, buttons, tables, and pixel glyphs as
every GeoField page.

- `site.css` — design tokens, themes, header, hero, and footer.
- `app.css` — panels, forms, tabs, buttons, tables, chips, and print rules.
- `site.js` — theme toggle, meteor field, hero glyphs (including `antenna`,
  `tripod`, and `network`), and scroll rail.
- `fonts/` — self-hosted Sora and Source Sans 3 (see `fonts/SORA-LICENSE.txt`).
- `favicon.svg` — the pixel-trail mark.

Rules:

- Do not edit these files here. Copy updated versions from the Field Checker
  repository.
- Tool-specific styles belong in `../css/style.css`.
- `python scripts/build_singlefile_dist.py` inlines these files, with the fonts and
  favicon as data URIs, into the single-file builds.
