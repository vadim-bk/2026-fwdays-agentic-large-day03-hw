## Context

Excalidraw today models free-form labels as `ExcalidrawTextElement` (`type: "text"`) with font metrics, wrapping, and canvas rendering via `fillText` per line in `packages/element` ([`renderElement.ts`](../../../packages/element/src/renderElement.ts)). There is no dedicated construct for monospace code or syntax-colored tokens. The product rule set disallows DOM/React for the main drawing surface and discourages new npm dependencies without approval, so highlighting and layout must fit the existing 2D canvas (and static SVG) pipeline.

## Goals / Non-Goals

**Goals:**

- Let users place **code snippet** elements on the canvas with **readable monospace rendering**, optional **language tag**, and **persistence** in scene JSON.
- Support **resize**, **selection**, **copy/paste**, and **export** (at minimum PNG/canvas path; SVG should not silently drop content).
- Integrate with **actionManager**-driven state updates like other elements.

**Non-Goals:**

- Full IDE features (debugging, LSP, multi-file projects).
- Arbitrary HTML embeds or iframe-based code widgets on the canvas.
- Guaranteeing pixel-perfect match with every theme in every highlighter grammar on day one (start with a bounded language list or plain “code style” fallback).

## Decisions

1. **New element type vs extended text**  
   **Choice:** Introduce a dedicated element type (e.g. `code` or `codeSnippet`) rather than overloading `text` with a `kind: "code"` flag.  
   **Rationale:** Clear separation for toolbar, hit testing, serialization versioning, and avoiding accidental binding-to-shape behavior meant for labels.  
   **Alternative:** Flag on text — fewer types but higher risk of regressions in text-container logic.

2. **Syntax highlighting implementation**  
   **Choice:** Tokenize in JS and draw colored spans on canvas using the same line layout primitives as text (measure per run, `fillText` per token or per segment), or use a small **hand-rolled tokenizer** for a fixed palette of languages first.  
   **Rationale:** Respects “canvas not DOM” and minimizes dependency risk.  
   **Alternative:** Prism/shiki in a hidden DOM — rejected for canvas architecture; **optional** later for SVG export via pre-generated `<tspan>` if specs require it.

3. **Sizing and wrap**  
   **Choice:** Default **horizontal scroll** inside the box or **soft wrap** at element width (match FigJam-like UX in proposal validation); initial implementation should pick one and document; **soft wrap** aligns better with existing `wrapText` patterns if adapted for monospace metrics.

4. **Language field**  
   **Choice:** Store `language: string | null` (e.g. `"ts"`, `"python"`); unknown languages **SHALL** render as uncolored monospace.  
   **Rationale:** Stable schema, progressive enhancement.

5. **Embedding API**  
   **Choice:** Snippets participate in the normal element list; optional prop `UIOptions` / `appState` flag to hide the insert control for embedders who do not want the feature.

## Risks / Trade-offs

- **Large files on canvas** → Mitigation: soft cap on paste size or warn in UI; lazy tokenization.
- **Performance** → Mitigation: cache tokenization by `(text, language)` hash; recompute on edit only.
- **Collaboration / backward compatibility** → Mitigation: older clients ignore unknown `type`; document downgrade behavior (show placeholder or skip) in migration notes.
- **SVG export fidelity** → Mitigation: emit plain text with monospace style if full color export is deferred.

## Migration Plan

1. Ship schema with new `type`; ensure parsers treat unknown types gracefully where already supported.
2. No mandatory server migration; file format version bump only if required by existing versioning rules in the repo.
3. Rollback: feature-flag or revert type registration; existing files with snippets remain parseable or are ignored by old builds per compatibility policy.

## Open Questions

- Exact **default** for wrap vs scroll and **max height** behavior.
- Whether **line numbers** ship in v1 or as a follow-up.
- Final list of **languages** for v1 highlighting vs plain fallback only.
