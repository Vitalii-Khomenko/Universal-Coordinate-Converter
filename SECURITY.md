# Security Policy

## Local-First Privacy

Coordinate input and imported TXT files are processed in the browser. The app
does not intentionally upload coordinate data, use analytics, set cookies, or
store project data in a remote service.

Downloaded TXT and KML files are created locally with browser object URLs.
Users should still treat exported coordinate files according to their own
organization's data-handling requirements.

## Network Use

Core coordinate transformations, validation, TXT import/export, clipboard
output, and KML generation do not require a network connection.

The optional map tab loads OpenLayers from jsDelivr and may request map tiles.
If those resources are unavailable, the map feature is disabled while the core
converter remains usable.

## Supported Deployment

The supported workflows are:

- Open `index.html` with its adjacent `css/` and `js/` directories.
- Open `dist/universal-coordinate-converter.generated.html` as a portable file.
- Serve either version from a trusted static host.

When deploying through HTTP, configure equivalent security headers at the
server or hosting platform. The HTML Content Security Policy is defense in
depth and should not replace response headers on a hosted deployment.

## Content Security Policy

The source and generated application restrict scripts and styles to local
assets and the jsDelivr origin used by the versioned OpenLayers URL. Image and
network access is limited to the OpenStreetMap tile origin. Plugins, embedded
objects, base URL changes, and form submissions are blocked. The generated
build permits inline local source because its CSS and JavaScript are
intentionally bundled into one file.

## Input and Export Safety

- Imported files are limited to TXT input and the existing size guard.
- Numeric fields use strict decimal validation.
- Imported point IDs are rendered with `textContent`.
- KML point names are XML-escaped.
- Generated object URLs are revoked after download.

## Reporting Issues

Report security concerns privately to the repository owner when possible.
Include the affected version or commit, reproduction steps, impact, and any
suggested mitigation. Do not include sensitive production coordinates in a
public issue.
