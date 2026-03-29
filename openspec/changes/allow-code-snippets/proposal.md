## Why

Excalidraw is widely used for technical diagrams and architecture sketches, but code must be pasted as plain text, which loses readability and structure compared to tools like FigJam that support dedicated code snippets ([GitHub issue #5940](https://github.com/excalidraw/excalidraw/issues/5940)). Adding first-class code blocks would make technical whiteboarding more effective without leaving the canvas.

## What Changes

- Introduce a **code snippet** element (or clearly defined subtype of text) that stores source text plus optional **language identifier** for highlighting and tooling.
- **Canvas and SVG/PNG export**: render snippets with **monospace typography**, **syntax highlighting** (or at least a distinct code style when highlighting is unavailable), and padding or frame styling consistent with Excalidraw’s visual language.
- **Editing**: allow in-place or modal editing of code; support common shortcuts (tab indent behavior where applicable).
- **Serialization**: extend scene JSON so snippets round-trip in `.excalidraw` / library / collaboration payloads; document any new fields for embedders of `@excalidraw/excalidraw`.
- **Optional / phased**: theme alignment (light/dark), line numbers, wrap vs horizontal scroll—exact scope to be nailed in design; no **BREAKING** removal of existing APIs intended.

## Capabilities

### New Capabilities

- `code-snippets`: User-visible behavior and data model for code snippet elements on the canvas—creation, edit, display, export, and persistence.

### Modified Capabilities

- _(None — no existing OpenSpec capability specs in this repo yet.)_

## Impact

- **`packages/element`**: element type(s), bounds, hit testing, render path (canvas + static SVG).
- **`packages/excalidraw`**: UI to insert and edit snippets, action manager integration, any new toolbar or context menu entries.
- **Rendering**: avoid DOM-based drawing for the main canvas per project constraints; syntax colors may use a lightweight highlighter or precomputed token spans aligned with the existing pipeline.
- **Dependencies**: prefer existing utilities; **no new npm packages** without explicit approval (per project rules)—design should default to minimal or zero new deps.
- **Public API / embedders**: optional props or callbacks if embedders need to disable or customize code snippets.
