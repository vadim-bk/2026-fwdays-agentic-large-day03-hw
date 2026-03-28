## Why

Diagrams stay static when text cannot point to tickets, docs, or URLs. Users expect the same `[label](url)` pattern used on GitHub and in markdown so shapes and labels become actionable without leaving the canvas ([excalidraw/excalidraw#11024](https://github.com/excalidraw/excalidraw/issues/11024)).

## What Changes

- Parse markdown-style link syntax `[label](hyperlink)` inside text elements (consistent with common markdown link behavior).
- Render recognized URLs as visually distinct, clickable regions on the canvas (e.g. underline and link color).
- On pointer activation, open the target URL in a new browser tab.
- Apply URL safety rules (allowlist / scheme checks) to reduce broken, `javascript:`, or other unsafe navigations.

## Capabilities

### New Capabilities

- `canvas-text-hyperlinks`: User-visible behavior for entering, displaying, and activating markdown-style links in text on the canvas, including styling and safe navigation.

### Modified Capabilities

- _(none — no existing `openspec/specs/` capability documents in this repository yet.)_

## Impact

- **Rendering**: Text layout and canvas hit-testing in `packages/excalidraw` (and any shared text utilities) must expose link spans and pointer handling without drawing links via arbitrary HTML overlays unless that is already the pattern.
- **Input / editing**: Text editing may need to preserve link syntax or an internal representation while typing.
- **Serialization**: `.excalidraw` / element model may need fields or agreed encoding if links are not purely syntax in `text`.
- **Security**: Central validation of schemes and origins before `window.open` or navigation.
- **Dependencies**: No new npm packages unless the project explicitly approves (per repo constraints).
