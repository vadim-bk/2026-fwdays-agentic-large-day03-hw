import { normalizeLink } from "@excalidraw/common";

const LINK_PATTERN = /^\[([^\]\n]+)\]\(([^\)\n]+)\)/;

export type HyperlinkCandidate =
  | { type: "plain"; start: number; end: number }
  | {
      type: "link";
      start: number;
      end: number;
      label: string;
      urlRaw: string;
      raw: string;
    };

/**
 * Parse `[label](url)` on a single line (no newlines inside label or URL).
 */
export const parseTextHyperlinkCandidates = (
  line: string,
  from = 0,
): HyperlinkCandidate[] => {
  const out: HyperlinkCandidate[] = [];
  let i = from;
  while (i < line.length) {
    const open = line.indexOf("[", i);
    if (open === -1) {
      if (i < line.length) {
        out.push({ type: "plain", start: i, end: line.length });
      }
      break;
    }
    if (open > i) {
      out.push({ type: "plain", start: i, end: open });
    }
    const rest = line.slice(open);
    const m = LINK_PATTERN.exec(rest);
    if (m && m[1].length > 0 && m[2].trim().length > 0) {
      const raw = m[0];
      out.push({
        type: "link",
        start: open,
        end: open + raw.length,
        label: m[1],
        urlRaw: m[2],
        raw,
      });
      i = open + raw.length;
    } else {
      out.push({ type: "plain", start: open, end: open + 1 });
      i = open + 1;
    }
  }
  return out;
};

export const isValidTextHyperlinkUrl = (urlRaw: string): string | null => {
  const trimmed = urlRaw.trim();
  if (!trimmed) {
    return null;
  }
  const normalized = normalizeLink(trimmed);
  if (!normalized || normalized === "about:blank") {
    return null;
  }
  return normalized;
};

/** For width measurement: valid links → label; invalid → raw. */
export const toTextMeasurementLine = (line: string): string => {
  let result = "";
  for (const part of parseTextHyperlinkCandidates(line)) {
    if (part.type === "plain") {
      result += line.slice(part.start, part.end);
    } else {
      const n = isValidTextHyperlinkUrl(part.urlRaw);
      result += n ? part.label : part.raw;
    }
  }
  return result;
};

export const lineContainsHyperlinkSyntax = (line: string): boolean =>
  line.includes("[") && line.includes("](");
