"""Build the portable single-file application into dist/.

The editable source lives in index.html, css/, and js/. The historical
root-level standalone file is preserved as a stable field release.
"""

from __future__ import annotations

import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DIST_DIR = ROOT / "dist"
OUTPUT_PATH = DIST_DIR / "universal-coordinate-converter.generated.html"
SCRIPT_ORDER = [
    "js/transformations.js",
    "js/app.js",
]
INLINE_CSP = (
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
    "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
    "img-src 'self' data: blob: https://tile.openstreetmap.org; "
    "connect-src https://tile.openstreetmap.org; object-src 'none'; "
    "base-uri 'none'; form-action 'none'"
)


def main() -> None:
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    css = (ROOT / "css" / "style.css").read_text(encoding="utf-8").rstrip()

    html = re.sub(
        r'<meta http-equiv="Content-Security-Policy" content="[^"]+">',
        f'<meta http-equiv="Content-Security-Policy" content="{INLINE_CSP}">',
        html,
    )
    html = html.replace(
        '<link rel="stylesheet" href="css/style.css">',
        f"<style>\n{css}\n    </style>",
    )

    for script_path in SCRIPT_ORDER:
        script = (ROOT / script_path).read_text(encoding="utf-8").rstrip()
        html = html.replace(
            f'<script src="{script_path}"></script>',
            f"<script>\n{script}\n    </script>",
        )

    html = html.replace(
        "<title>Universal Coordinate Converter</title>",
        "<title>Universal Coordinate Converter (Generated Single File)</title>",
    )

    DIST_DIR.mkdir(exist_ok=True)
    OUTPUT_PATH.write_text(html, encoding="utf-8")
    print(f"Wrote {OUTPUT_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
