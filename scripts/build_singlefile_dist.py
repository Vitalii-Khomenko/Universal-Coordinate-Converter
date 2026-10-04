"""Build the portable single-file application.

The editable source lives in index.html, css/, js/, and the vendored GeoField
front end in shared/ (site.css, app.css, site.js, fonts, favicon). The build
inlines every local asset, including fonts and the favicon as data URIs, and
writes two files with the same body:

- dist/universal-coordinate-converter.generated.html (generated build)
- universal-coordinate-converter.html (stable field release)

OpenLayers stays on its CDN because it is needed only by the optional map tab.
"""

from __future__ import annotations

import base64
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SHARED = ROOT / "shared"
DIST_DIR = ROOT / "dist"
GENERATED_PATH = DIST_DIR / "universal-coordinate-converter.generated.html"
FIELD_RELEASE_PATH = ROOT / "universal-coordinate-converter.html"
TITLE = "<title>Coordinate converter · GeoField · airwitech</title>"
GENERATED_TITLE = "<title>Coordinate converter · GeoField · airwitech (generated single file)</title>"
INLINE_CSP = (
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
    "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
    "img-src 'self' data: blob: https://tile.openstreetmap.org; "
    "font-src 'self' data:; "
    "connect-src https://tile.openstreetmap.org; object-src 'none'; "
    "base-uri 'none'; form-action 'none'"
)
FAVICON_LINK = '<link rel="icon" href="shared/favicon.svg" type="image/svg+xml">'
STYLE_LINKS = [
    ('    <link rel="stylesheet" href="shared/site.css">', "shared/site.css"),
    ('    <link rel="stylesheet" href="shared/app.css">', "shared/app.css"),
    ('    <link rel="stylesheet" href="css/style.css">', "css/style.css"),
]
SCRIPT_ORDER = [
    "shared/site.js",
    "js/transformations.js",
    "js/app.js",
]
FONT_URL_PATTERN = re.compile(r'url\("fonts/([^"?]+)(?:\?[^"]*)?"\)')


def to_data_uri(data: bytes, media_type: str) -> str:
    return f"data:{media_type};base64,{base64.b64encode(data).decode('ascii')}"


def inline_fonts(css: str) -> str:
    def embed(match: re.Match[str]) -> str:
        font = (SHARED / "fonts" / match.group(1)).read_bytes()
        return f'url("{to_data_uri(font, "font/woff2")}")'

    return FONT_URL_PATTERN.sub(embed, css)


def replace_once(html: str, marker: str, replacement: str) -> str:
    if marker not in html:
        raise RuntimeError(f"index.html is missing the expected reference: {marker}")
    return html.replace(marker, replacement, 1)


def build_html() -> str:
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    if TITLE not in html:
        raise RuntimeError("index.html is missing the expected title.")
    html = re.sub(
        r'<meta http-equiv="Content-Security-Policy" content="[^"]+">',
        f'<meta http-equiv="Content-Security-Policy" content="{INLINE_CSP}">',
        html,
        count=1,
    )

    favicon = to_data_uri((SHARED / "favicon.svg").read_bytes(), "image/svg+xml")
    html = replace_once(html, FAVICON_LINK, f'<link rel="icon" href="{favicon}" type="image/svg+xml">')

    for link, relative_path in STYLE_LINKS:
        css = (ROOT / relative_path).read_text(encoding="utf-8").rstrip()
        if relative_path == "shared/site.css":
            css = inline_fonts(css)
        html = replace_once(html, link, f"    <style>\n{css}\n    </style>")

    for script_path in SCRIPT_ORDER:
        script = (ROOT / script_path).read_text(encoding="utf-8").rstrip()
        html = replace_once(
            html,
            f'<script src="{script_path}"></script>',
            f"<script>\n{script}\n    </script>",
        )
    return html


def main() -> None:
    html = build_html()
    DIST_DIR.mkdir(exist_ok=True)
    GENERATED_PATH.write_text(html.replace(TITLE, GENERATED_TITLE, 1), encoding="utf-8")
    FIELD_RELEASE_PATH.write_text(html, encoding="utf-8")
    print(f"Wrote {GENERATED_PATH.relative_to(ROOT)}")
    print(f"Wrote {FIELD_RELEASE_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
