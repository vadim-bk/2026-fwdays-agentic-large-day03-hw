## ADDED Requirements

### Requirement: Markdown-style link syntax in text

The editor SHALL recognize contiguous substrings in text element content that match the pattern `[label](url)` where `label` is non-empty visible text and `url` is a non-empty string subject to the same validity rules as other hyperlinks in the application. Malformed or incomplete tokens SHALL be shown as plain text without link behavior.

#### Scenario: Valid link is interactive

- **WHEN** a text element contains a well-formed `[documentation](https://example.com/path)` substring and the URL passes validation
- **THEN** the substring `documentation` SHALL be rendered as a link span with visual affordance distinct from normal text

#### Scenario: Invalid token stays plain

- **WHEN** text contains `[unclosed` or `](not-a-url)` or a URL that fails validation
- **THEN** no part of that substring SHALL navigate on activation and it SHALL render as ordinary text

### Requirement: Link activation opens validated URL in a new tab

The system SHALL open the link target in a new browser tab (or equivalent isolated browsing context) using safe defaults (e.g. `noopener`, ` noreferrer` where applicable). Navigation SHALL NOT occur if the URL is rejected by security or allowlist rules.

#### Scenario: Click on link span

- **WHEN** the user activates a rendered link span with the primary pointer action and the URL is allowed
- **THEN** the application SHALL open that URL in a new tab and SHALL NOT navigate the current Excalidraw tab away from the document

#### Scenario: Blocked scheme

- **WHEN** the URL uses a disallowed scheme (e.g. `javascript:`)
- **THEN** the application SHALL NOT perform navigation

### Requirement: Visual distinction of links

Link spans SHALL be visually distinguishable from non-link text in the canvas rendering (including at least one of: distinct color, underline, or both) while preserving readability in light and dark themes.

#### Scenario: Themed contrast

- **WHEN** the user switches between light and dark theme
- **THEN** link styling SHALL remain visibly distinct from body text without becoming illegible

### Requirement: Consistency with existing hyperlink policy

In-text links SHALL respect the same normalization and permission hooks as element-level hyperlinks (e.g. URL normalization and optional host/scheme checks). If the application blocks a URL for element links, it SHALL also block the same URL for in-text links.

#### Scenario: Host not allowed

- **WHEN** the configured link policy rejects a host for element links
- **THEN** an in-text link to that host SHALL not navigate when activated
