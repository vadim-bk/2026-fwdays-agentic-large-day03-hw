# Code snippets capability specification

## ADDED Requirements

### Requirement: Code snippet element exists on the canvas

The system SHALL support a distinct element type representing a code snippet with associated source text and an optional language identifier.

#### Scenario: User inserts a snippet

- **GIVEN** the user has an open Excalidraw canvas
- **WHEN** the user creates a code snippet (e.g. via toolbar or shortcut)
- **THEN** a new snippet element appears on the canvas with editable placeholder content and a default size

#### Scenario: Serialization round-trip

- **GIVEN** a scene contains one or more code snippet elements with non-empty source text and a language identifier (or no language identifier)
- **WHEN** the scene is saved or exported to Excalidraw JSON and reloaded
- **THEN** each snippet’s source text and language identifier are preserved without loss

### Requirement: Monospace presentation

The system SHALL render code snippet content using a monospace style consistent with the active theme so code remains readable at typical zoom levels.

#### Scenario: Canvas render

- **GIVEN** the user has an open Excalidraw canvas with a visible code snippet element
- **WHEN** a snippet is visible on the canvas
- **THEN** its glyphs use monospace metrics and spacing appropriate for source code

### Requirement: Optional syntax highlighting

The system SHALL apply syntax highlighting for snippet content when the snippet’s language is supported; when the language is missing or unsupported, the system SHALL still render monospace text without throwing errors.

#### Scenario: Supported language

- **GIVEN** the user has an open Excalidraw canvas with a code snippet element containing source text
- **WHEN** a snippet’s language is set to a supported identifier
- **THEN** tokens are visually distinguished (e.g. by color) while preserving the same source text

#### Scenario: Unsupported or empty language

- **GIVEN** the user has an open Excalidraw canvas with a code snippet element containing source text
- **WHEN** the language is unset or not supported
- **THEN** the snippet renders as monospace plain text

### Requirement: Edit snippet content and language

The system SHALL allow the user to change snippet source text and to set or clear the language identifier through the editor UI.

#### Scenario: Edit text

- **GIVEN** the user has an open Excalidraw canvas with a code snippet element selected for editing
- **WHEN** the user finishes editing snippet text
- **THEN** the element bounds and rendered content update to reflect the new text

#### Scenario: Change language

- **GIVEN** the user has an open Excalidraw canvas with a code snippet element containing source text
- **WHEN** the user selects a different language for the snippet
- **THEN** highlighting updates to match the new language or falls back to plain monospace

### Requirement: Snippets participate in standard element operations

The system SHALL treat code snippets like other top-level elements for selection, deletion, duplicate, z-order, transform (move/resize), clipboard copy where applicable, and inclusion in the element list passed to embedders.

#### Scenario: Transform

- **GIVEN** the user has an open Excalidraw canvas with a code snippet element selected
- **WHEN** the user moves or resizes a selected snippet
- **THEN** the snippet’s position and dimensions update and rendering remains correct

### Requirement: Export must not silently drop snippet content

The system SHALL include snippet content in raster export. For SVG (or other vector export), the system SHALL either render equivalent visible content or explicitly document and implement a defined fallback (e.g. monospace text) so that export does not produce an empty or misleading representation without an intentional product decision.

#### Scenario: Raster export

- **GIVEN** a scene contains a code snippet element with visible text in the export region
- **WHEN** the user exports the scene to a bitmap including the snippet’s region
- **THEN** the exported image shows the snippet’s text in monospace form with highlighting behavior consistent with the canvas or the spec-defined fallback

#### Scenario: Empty snippet text

- **GIVEN** the user has an open Excalidraw canvas with a code snippet element selected for editing
- **WHEN** the user clears the snippet source text to an empty string
- **THEN** the snippet remains a valid element and renders an empty state without errors (e.g. placeholder or empty content), and serialization preserves the empty string

#### Scenario: Very long code (overflow behavior)

- **GIVEN** the user has an open Excalidraw canvas with a code snippet element containing very long code that exceeds the element bounds in width and/or height
- **WHEN** the snippet is rendered on the canvas at typical zoom levels
- **THEN** the system presents overflow in a defined way without breaking layout (e.g. line wrapping within the element bounds or an internal scroll/clipping behavior), and raster export reflects the same overflow behavior

#### Scenario: Special and Unicode characters

- **GIVEN** the user has an open Excalidraw canvas with a code snippet element containing characters outside ASCII (e.g. emoji, combining marks, RTL text, and non‑Latin scripts)
- **WHEN** the snippet is rendered, edited, serialized, reloaded, and raster-exported
- **THEN** the displayed and persisted text matches the original sequence of Unicode code points (no loss, reordering, or corruption) and rendering does not throw errors
