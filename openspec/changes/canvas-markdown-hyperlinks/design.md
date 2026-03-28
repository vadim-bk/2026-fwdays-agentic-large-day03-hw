## Context

Excalidraw already supports a per-element `link` URL (hyperlink popup, icon on canvas, SVG export anchors) via `normalizeLink` and related helpers. Text is drawn on the canvas through the existing text pipeline; there is no first-class “span with URL” inside a single text element today. Issue [#11024](https://github.com/excalidraw/excalidraw/issues/11024) asks for markdown-style `[label](url)` inside text, with visible link styling and safe, new-tab navigation.

Constraints from the project: state updates through the existing action model, canvas-based text rendering (not arbitrary DOM text layers for drawing), and no new npm dependencies without explicit approval.

## Goals / Non-Goals

**Goals:**

- Parse `[label](url)` segments in text content and treat each as one logical link span after validation.
- Draw link labels with clear affordance (e.g. color + underline) aligned with theme/accessibility where applicable.
- On primary activation (click / equivalent), open the validated URL in a new browsing context (e.g. `window.open` with `noopener` and `noreferrer`).
- Reuse or align with existing link normalization and `isURLAllowed`-style hooks so behavior matches element-level links where sensible.

**Non-Goals:**

- Full CommonMark or rich markdown (headings, images in text, autolinks without brackets, reference-style links).
- Inline HTML paste or arbitrary `<a>` in canvas DOM.
- Changing the semantics of the existing whole-element `link` field unless required for consistency (prefer additive behavior).

## Decisions

1. **Storage model** — **Option A (preferred initially):** Keep links as literal `[label](url)` substrings in `text` so files round-trip without a schema migration. **Option B:** Add structured link metadata (ranges + URLs) on the text element if parsing on every frame is too costly or if editing UX requires it. Start with A unless profiling or editing complexity forces B.

2. **Parsing** — Use a small, strict lexer/parser for link tokens (balanced `[]` and `()` for URL) rather than pulling in a markdown library, to avoid new dependencies and to control edge cases (nested brackets, line breaks inside URLs).

3. **Hit testing** — Extend text layout output so each link span has scene-space bounds (or glyph-run boxes) for pointer picking. On hit, navigation runs after the same guards as element links; on miss, preserve current text selection / element selection behavior.

4. **Rendering** — During text draw, emit styled runs for link text (underline + link color). Match or derive colors from existing hyperlink UI tokens if present.

5. **Editing** — While the wysiwyg textarea is active, raw `[label](url)` may show as plain text (simplest). Alternatively, a future pass could add highlighting in the editor; initial implementation can defer in-editor styling if it stays correct on commit.

6. **Security** — Apply the same URL scheme and allowlist rules as `normalizeLink` / app `onLinkOpen` semantics: reject `javascript:`, `data:` where disallowed, and invalid URLs; no navigation without passing validation.

## Risks / Trade-offs

- **Ambiguous or malicious strings** → Strict token rules; invalid URLs render as plain text, not clickable.
- **Performance with many links** → Cache parsed spans per text version + dimensions; invalidate on text or font change.
- **Conflict with whole-element link** → Define precedence (e.g. in-text link hit wins under pointer; element link icon still for container-level URL) and document in tasks.
- **Export (PNG/PDF/SVG)** → SVG may need `<a>` per span in text export paths; PNG remains non-interactive; ensure static SVG export matches behavior where technically possible.

## Migration Plan

- No server migration. Existing drawings unchanged until users add link syntax.
- Backward compatible: old files load as today; new syntax opt-in via user input.
- Rollback: feature-flag or revert commits touching parser/renderer/pointer if critical issues appear.

## Open Questions

- Exact character set allowed inside URLs (spaces, Unicode, parentheses) vs GitHub-flavored markdown.
- Whether bound text inside containers shares the same link behavior as standalone text elements (assumed yes).
- Accessibility: keyboard focus order for in-canvas links vs current focus model.
