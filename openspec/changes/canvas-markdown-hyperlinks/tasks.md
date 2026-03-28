## 1. Parsing and validation

- [x] 1.1 Implement a strict parser for `[label](url)` tokens in plain text (no new markdown dependency); define edge cases (nested brackets, empty label/url, newlines).
- [x] 1.2 Map parsed URLs through existing `normalizeLink` / allowlist logic used by element-level links; treat failures as non-link plain text.

## 2. Layout and rendering

- [x] 2.1 Extend text measurement and drawing so each validated link span produces styled runs (color + underline) consistent with light/dark theme.
- [x] 2.2 Cache or incrementally update parsed link metadata keyed by text content and font metrics to avoid redundant work on every frame.

## 3. Interaction

- [x] 3.1 Add scene-space hit testing for link spans on pointer down/up; document interaction precedence vs whole-element `link` and text editing.
- [x] 3.2 On confirmed activation of an allowed URL, open in a new tab with `noopener` and `noreferrer`; ensure no navigation when URL is blocked.

## 4. Editing and serialization

- [x] 4.1 Preserve `[label](url)` verbatim in the text element through wysiwyg submit and round-trip save/load (no accidental stripping).
- [x] 4.2 Manually verify bound text inside shapes behaves the same as standalone text for links.

## 5. Export and tests

- [x] 5.1 Update SVG (and any interactive HTML export) so link spans become `<a href="...">` where the export pipeline already wraps element-level links.
- [x] 5.2 Add automated tests for parser edge cases, blocked schemes, and at least one integration test for render/hit-test or open behavior (following existing Excalidraw test patterns).

## 6. Verification

- [x] 6.1 Run `yarn test:typecheck` and relevant test targets; fix regressions.
