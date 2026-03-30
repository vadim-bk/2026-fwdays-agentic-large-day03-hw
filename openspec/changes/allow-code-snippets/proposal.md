# Proposal

Add a first-class **code snippet** element to Excalidraw that renders **monospace** text (optionally **syntax-highlighted** by language), supports normal element interactions (create/select/resize/copy-paste/edit), and round-trips through scene serialization and export.

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

## Risks

- **Rendering performance**: Tokenizing and drawing many colored spans can add CPU cost, especially for large snippets or during resize/zoom.  
  **Mitigation**: Cache tokenization results by `(text, language)`; precompute per-line span layouts; optionally degrade to a single-color monospace render (no highlighting) above a size/complexity threshold.
- **Security / XSS from pasted snippets**: Snippets may contain HTML/JS-like content that could be unsafe if ever interpreted or embedded.  
  **Mitigation**: Treat snippet content as plain text only; never execute code; escape/sanitize any export/embedding paths that could end up in HTML contexts; keep rendering on canvas/SVG text primitives only.
- **Embedding/API surface complexity**: Adding a new element type can increase public API surface area and embedder maintenance burden.  
  **Mitigation**: Provide opt-out UI flags for embedders with backward-compatible defaults; document the new serialized fields clearly; ensure older clients degrade gracefully (e.g. render as plain text or skip).
- **Dependency creep**: Full-featured highlighters can pull in large dependencies and increase bundle size.  
  **Mitigation**: Enforce the no-new-deps policy by default; start with a lightweight internal tokenizer or plain-code styling; only add external deps with explicit approval and clear size/perf budgets.
