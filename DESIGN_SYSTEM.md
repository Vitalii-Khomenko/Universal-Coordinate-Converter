# GeoMonitoring Interface Standard

Version 1.0 — July 2026

## Purpose

The GeoMonitoring Interface Standard is the shared product design system for
browser tools used to collect, transform, review, and export geospatial
monitoring data. It establishes a consistent visual language and interaction
model for field technicians, surveyors, analysts, and project managers.

The standard is designed for:

- Smartphone and laptop use in office and field conditions.
- Dense numerical data without sacrificing readability.
- Local-first and offline-capable workflows.
- Clear separation between source data, processing actions, and results.
- Reliable operation with touch, mouse, and keyboard input.
- Progressive enhancement when maps or other online services are available.

## Product Principles

### 1. Evidence before decoration

Coordinates, timestamps, warnings, units, and system names are the primary
content. Decorative elements must never compete with operational data.

### 2. Local processing is a visible trust feature

When data remains on the device, state this near the product title or footer.
Do not imply that maps are offline when their tile service requires a network.

### 3. One primary action per workspace

Each task area has one visually dominant action. Import, copy, download, clear,
and navigation controls use secondary or quiet styles.

### 4. Source and result are separate states

Use a two-stage workflow:

1. Source data and configuration.
2. Processed results and export actions.

On wide screens, these stages may appear side by side. On narrow screens,
source data must appear before results.

### 5. Empty states explain the next step

Never show a blank data table as the initial state. Show a compact message that
identifies what will appear and what the user should do next.

### 6. Color communicates status, not ownership

Do not assign a different bright color to every button. Use the primary teal
for the main action. Reserve green, amber, and red for success, warning, and
error states.

## Visual Foundation

### Color tokens

| Token | Value | Usage |
| --- | --- | --- |
| `--ink-950` | `#071a22` | Deep product header and maximum contrast |
| `--ink-900` | `#0b202a` | Primary text |
| `--ink-700` | `#2c4a54` | Secondary text and quiet controls |
| `--ink-200` | `#d4dfe2` | Borders and dividers |
| `--ink-050` | `#f4f7f8` | Subtle panel and table backgrounds |
| `--canvas` | `#eaf0f2` | Application background |
| `--surface` | `#ffffff` | Panels and controls |
| `--primary-700` | `#075f5a` | Primary actions |
| `--primary-500` | `#0b8b82` | Focus, active states, and small accents |
| `--primary-100` | `#d9efec` | Selected navigation and soft emphasis |
| `--signal` | `#f2b84b` | Geospatial locator accent only |

Status colors are semantic:

- Success: green on a pale green surface.
- Warning: amber/brown on a pale amber surface.
- Error: dark red on a pale red surface.

Text and controls must not rely on color alone. Pair status color with explicit
text, structure, or a recognizable state label.

### Typography

Use the native system sans-serif stack for interface text:

```css
Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
```

Use a native monospace stack for coordinates, identifiers, logs, and examples:

```css
"SFMono-Regular", Consolas, "Liberation Mono", monospace
```

Rules:

- Page titles use strong weight and compact letter spacing.
- Section titles are sentence case.
- Labels are short and explicit.
- Small uppercase text is limited to eyebrows, workflow steps, and table
  headers.
- Body text must remain at least 16px by default.
- Operational helper text must remain at least 12px.

### Spacing

Use a four-pixel base scale:

`4, 8, 12, 16, 20, 24, 32, 40`

Prefer 20–24px panel padding on laptops and 16px on phones. Related controls
use 8–12px gaps. Separate workflow stages with 20–32px gaps.

### Shape and elevation

- Small controls: 8px radius.
- Panels and navigation groups: 14px radius.
- Product shell: 20px radius on wide screens.
- Use borders for structure and restrained shadows for elevation.
- Do not stack multiple strong shadows.

## Core Components

### Product header

The product header contains:

- Product family eyebrow.
- Specific tool name.
- One-sentence operational description.
- Optional local/offline trust indicator.

Use a dark technical surface with restrained geometric detail. Avoid large
illustrations that reduce space for the actual tool.

Primary navigation must begin below the product header. Do not pull navigation
under the header with negative margins or allow header decoration to obscure
interactive labels.

### Mode navigation

Use a segmented tab group for three to six peer workflows.

- Keep visible labels short.
- Put datum, EPSG, and projection detail inside the selected panel.
- Every tab must have `role="tab"`, `aria-selected`, `aria-controls`, and
  keyboard arrow navigation.
- Use a 44px minimum touch target.

### Workspace panel

Each workflow uses the same sequence:

1. Section heading with datum or EPSG context.
2. Source panel.
3. Results panel.

The source panel contains a descriptive label, input, optional configuration,
format help, and the primary action. The results panel contains a count, export
actions, an empty state, and the result visualization.

### Coordinate input

- Use a visible `<label>`; placeholders are supplementary only.
- Never make example data look like entered data.
- Put examples in an expandable format guide.
- Provide a `Load sample` action when examples are useful.
- Disable spelling correction for numerical batch input.
- State field order and optional fields directly above the control.

### Buttons

Button hierarchy:

| Style | Use |
| --- | --- |
| Primary | Run, convert, calculate, submit |
| Secondary | Import, copy, download, export |
| Quiet | Clear, dismiss, optional helpers |

All standard buttons must have a minimum height of 44px. Disabled controls must
remain legible and must not look interactive.

Button labels describe the result of the action: use `Convert coordinates`,
`Download TXT`, and `Export KML`, not vague labels such as `Go` or `Save`.

### Status messages

Status messages appear next to the action that produced them and use
`role="status"` with polite live updates.

Summaries include:

- Converted row count.
- Error count.
- Warning count.

Detailed line-level messages follow the summary. Do not use blocking dialogs
for normal batch validation.

### Results

- Show an explicit empty state before processing.
- Hide the empty state completely as soon as result rows exist.
- Show the number of result records.
- Disable copy and download actions until results exist.
- Keep units or coordinate systems in table headers.
- Preserve source `PointID` as the first column.
- On phones, allow horizontal table scrolling and display a short swipe hint.
- For monitoring products with more than eight columns, consider a compact
  card summary plus an optional detailed table.

### Maps

- Maps are enhancements; core calculations must not depend on them.
- The map panel identifies its online tile provider.
- Recalculate map size after a hidden panel becomes visible.
- If no points exist, show the configured regional overview.
- Keep export actions outside the map canvas.
- Minimum mobile map height is 320px.

## Responsive Behavior

### Wide screens: 1041px and above

- Source and results appear side by side.
- Results receive more horizontal space than input.
- Navigation uses one row.

### Medium screens: 761–1040px

- Source and results stack vertically.
- Navigation may remain in one row when labels fit.

### Small screens: 320–760px

- Navigation uses a two-column grid.
- Panels use 16px padding.
- The primary action spans the full row.
- Secondary actions may share rows.
- All interactive targets remain at least 44px high.
- Result tables scroll inside their container; the page itself must not scroll
  horizontally.

Do not hide required functionality on small screens. Simplify layout, not
capability.

## Accessibility Requirements

- Meet WCAG 2.2 AA contrast for text and interactive components.
- Maintain a visible focus ring on every interactive element.
- Support keyboard tab navigation and arrow-key tab switching.
- Use semantic headings in order.
- Associate every input with a visible label.
- Use `aria-live="polite"` for processing feedback.
- Respect `prefers-reduced-motion`.
- Do not communicate state by color alone.
- Keep touch targets at least 44×44 CSS pixels.
- Do not place essential instructions only in placeholder text.

## Content Rules

- Use English throughout shared products.
- Use accepted geodetic names and include EPSG codes where useful.
- Use `Decimal Degrees`, not mixed-language alternatives.
- Use `PointID` consistently in interface labels and exported headers.
- State coordinate field order exactly.
- Use the Unicode arrow `→` only for compact direction labels.
- Prefer direct, operational copy over promotional language.

## Implementation Rules

- Define visual constants as CSS custom properties in `:root`.
- Reuse the standard component classes before creating variants.
- Keep coordinate transformation mathematics independent from presentation.
- Preserve offline calculation and TXT workflows.
- External services may enhance maps but must not block conversion.
- Update result counts, empty states, and action availability from one shared
  state function.
- Test at 1440px, 1024px, 768px, 390px, and 320px widths.
- Validate keyboard operation, focus visibility, horizontal overflow, empty
  states, success states, warning states, and map resizing.

## Governance

This document is the baseline for all GeoMonitoring browser tools.

Changes to the standard must:

1. Solve a repeated user or product need.
2. Preserve existing accessibility requirements.
3. Add or revise a reusable token, rule, or component.
4. Be validated on phone and laptop layouts.
5. Be documented in English.

Product-specific exceptions must be documented next to the implementation.
One-off visual preferences are not sufficient reasons to diverge from the
standard.

## Release Checklist

- [ ] One clear primary action per workspace.
- [ ] Source and result stages are visually distinct.
- [ ] Initial tables use an explanatory empty state.
- [ ] Export controls are disabled without results.
- [ ] Input fields have visible labels and format guidance.
- [ ] Touch targets are at least 44px.
- [ ] Focus states are visible.
- [ ] No page-level horizontal overflow at 320px.
- [ ] Status, warning, and error states are understandable without color.
- [ ] Core processing works offline.
- [ ] Map failure does not block conversion.
- [ ] Documentation and supported file formats are current.
