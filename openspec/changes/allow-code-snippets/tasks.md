## 1. Data model and types

- [ ] 1.1 Add `ExcalidrawCodeSnippetElement` (or agreed type name) to `packages/element` types with `text`/`code`, `language`, and layout fields aligned with design
- [ ] 1.2 Extend `ExcalidrawElementType` unions, type guards (`isCodeSnippetElement`), and `newElement` factory for default snippet creation
- [ ] 1.3 Wire JSON restore/migrate paths so unknown versions degrade safely per compatibility rules

## 2. Measurement and layout

- [ ] 2.1 Implement monospace font string and line breaking for snippets (reuse or adapt `textMeasurements` / wrapping utilities)
- [ ] 2.2 Recompute width/height on text or width changes; define behavior for wrap vs overflow per design decision

## 3. Rendering

- [ ] 3.1 Draw snippets on canvas in `renderElement.ts` (plain monospace first, then token-colored spans if tokenizer exists)
- [ ] 3.2 Add static SVG / export path so vector output matches spec (text fallback acceptable if highlighted spans deferred, but not blank)
- [ ] 3.3 Ensure dark/light theme uses correct stroke/fill colors for tokens and background if a frame is used

## 4. Syntax highlighting (incremental)

- [ ] 4.1 Implement tokenizer or token-color map for an initial language set with graceful no-op for unsupported `language`
- [ ] 4.2 Cache tokenization by content hash until text or language changes

## 5. App integration

- [ ] 5.1 Register actions (insert, maybe “convert to snippet”) via `actionManager` and toolbar or context menu entry
- [ ] 5.2 Build edit UX: focus mode, textarea or contenteditable overlay pattern consistent with existing text editing (without violating canvas drawing rules for the painted output)
- [ ] 5.3 Language picker UI (dropdown or combobox) with “plain” option

## 6. Element operations

- [ ] 6.1 Ensure selection, transform handles, copy/paste, duplicate, and z-order work; exclude invalid bindings (e.g. arrow label containers) if snippets must not bind like `text`
- [ ] 6.2 Verify raster export includes snippets; add snapshot or visual test if the repo pattern supports it

## 7. Embedder and docs

- [ ] 7.1 Expose optional UI flag to hide snippet tools for `@excalidraw/excalidraw` consumers if required by design
- [ ] 7.2 Document new element fields for integrators (README or package docs only if the project already documents element shapes)

## 8. Verification

- [ ] 8.1 Run `yarn test:typecheck` and targeted tests / `yarn test:update` per project workflow
- [ ] Run `yarn build`
- [ ] 8.2 Manually verify insert, edit, language change, save/reload, and export paths against `specs/code-snippets/spec.md` scenarios
