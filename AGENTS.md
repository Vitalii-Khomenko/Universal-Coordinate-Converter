# Project Instructions

## Language Policy

Use English only throughout this project.

This applies to:

- User-facing UI text.
- Browser alerts, prompts, buttons, labels, and validation messages.
- Documentation and README files.
- Code comments and inline developer notes.
- Script output and command-line prompts.
- Commit messages, pull request titles, pull request descriptions, and issue text.
- Generated example data, unless the data format explicitly requires another language.

Do not add Russian or any other non-English text to project files.

## Development Notes

- Keep the app usable as a local browser-based coordinate conversion tool unless a task explicitly introduces a backend.
- Keep the main application in one self-contained HTML file where practical so it can be opened directly in a browser without installation or a server.
- Preserve offline core coordinate calculations. External dependencies are acceptable only for non-essential features such as map visualization.
- Use built-in mathematical formulas for coordinate transformations instead of external calculation libraries unless a task explicitly changes that rule.
- Keep controls touch-friendly, readable, and comfortable on both smartphone and laptop browsers.
- Preserve TXT import/export workflows and document any supported file formats.
- Update project documentation after each functional change.
- After each functional update, run validation tests, commit the changes, and push the updated project to GitHub.
- Validate coordinate conversions with known reference points when changing transformation logic.
- Keep comments and developer notes concise, accurate, and in English.
