## ADDED Requirements

### Requirement: Code snippet element exists on the canvas

The system SHALL support a distinct element type representing a code snippet with associated source text and an optional language identifier.

#### Scenario: User inserts a snippet

- **WHEN** the user creates a code snippet (e.g. via toolbar or shortcut)
- **THEN** a new snippet element appears on the canvas with editable placeholder content and a default size

#### Scenario: Serialization round-trip

- **WHEN** the scene is saved or exported to Excalidraw JSON and reloaded
- **THEN** each snippet’s source text and language identifier are preserved without loss

### Requirement: Monospace presentation

The system SHALL render code snippet content using a monospace style consistent with the active theme so code remains readable at typical zoom levels.

#### Scenario: Canvas render

- **WHEN** a snippet is visible on the canvas
- **THEN** its glyphs use monospace metrics and spacing appropriate for source code

### Requirement: Optional syntax highlighting

The system SHALL apply syntax highlighting for snippet content when the snippet’s language is supported; when the language is missing or unsupported, the system SHALL still render monospace text without throwing errors.

#### Scenario: Supported language

- **WHEN** a snippet’s language is set to a supported identifier
- **THEN** tokens are visually distinguished (e.g. by color) while preserving the same source text

#### Scenario: Unsupported or empty language

- **WHEN** the language is unset or not supported
- **THEN** the snippet renders as monospace plain text

### Requirement: Edit snippet content and language

The system SHALL allow the user to change snippet source text and to set or clear the language identifier through the editor UI.

#### Scenario: Edit text

- **WHEN** the user finishes editing snippet text
- **THEN** the element bounds and rendered content update to reflect the new text

#### Scenario: Change language

- **WHEN** the user selects a different language for the snippet
- **THEN** highlighting updates to match the new language or falls back to plain monospace

### Requirement: Snippets participate in standard element operations

The system SHALL treat code snippets like other top-level elements for selection, deletion, duplicate, z-order, transform (move/resize), clipboard copy where applicable, and inclusion in the element list passed to embedders.

#### Scenario: Transform

- **WHEN** the user moves or resizes a selected snippet
- **THEN** the snippet’s position and dimensions update and rendering remains correct

### Requirement: Export must not silently drop snippet content

The system SHALL include snippet content in raster export. For SVG (or other vector export), the system SHALL either render equivalent visible content or explicitly document and implement a defined fallback (e.g. monospace text) so that export does not produce an empty or misleading representation without an intentional product decision.

#### Scenario: Raster export

- **WHEN** the user exports the scene to a bitmap including the snippet’s region
- **THEN** the exported image shows the snippet’s text in monospace form with highlighting behavior consistent with the canvas or the spec-defined fallback
