/**
 * Detects when the entire string (after trim) is a single markdown link
 * `[label](url)`. Partial inline links like `See [here](url) for more` are not
 * matched — callers should leave such text unchanged.
 *
 * URL validation and sanitization are the caller's responsibility (e.g. normalizeLink).
 */
export const tryParseMarkdownLink = (
  text: string,
): { label: string; url: string } | null => {
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }
  const match = trimmed.match(/^\[([^\]]*)\]\(([^)]*)\)$/);
  if (!match) {
    return null;
  }
  return { label: match[1], url: match[2].trim() };
};

/** True when a normalized URL from normalizeLink should be stored from markdown input. */
export const isSafeMarkdownLinkUrl = (normalized: string) => {
  const t = normalized.trim();
  return t.length > 0 && t !== "about:blank";
};
