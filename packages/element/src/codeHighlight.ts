import { THEME } from "@excalidraw/common";

import type { Theme } from "./types";

export type CodeTokenKind =
  | "keyword"
  | "string"
  | "comment"
  | "number"
  | "default";

export type CodeToken = {
  text: string;
  kind: CodeTokenKind;
};

const MAX_CACHE_ENTRIES = 128;
const tokenCache = new Map<string, CodeToken[]>();

const cacheGet = (key: string): CodeToken[] | undefined => tokenCache.get(key);
const cacheSet = (key: string, tokens: CodeToken[]) => {
  if (tokenCache.size >= MAX_CACHE_ENTRIES) {
    const first = tokenCache.keys().next().value;
    if (first !== undefined) {
      tokenCache.delete(first);
    }
  }
  tokenCache.set(key, tokens);
};

const KEYWORDS_JS = new Set([
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "debugger",
  "default",
  "delete",
  "do",
  "else",
  "export",
  "extends",
  "false",
  "finally",
  "for",
  "function",
  "if",
  "import",
  "in",
  "instanceof",
  "let",
  "new",
  "null",
  "return",
  "super",
  "switch",
  "this",
  "throw",
  "true",
  "try",
  "typeof",
  "var",
  "void",
  "while",
  "with",
  "yield",
  "async",
  "await",
  "enum",
  "implements",
  "interface",
  "package",
  "private",
  "protected",
  "public",
  "static",
  "readonly",
  "type",
  "from",
  "as",
  "of",
]);

const KEYWORDS_PY = new Set([
  "and",
  "as",
  "assert",
  "async",
  "await",
  "break",
  "class",
  "continue",
  "def",
  "del",
  "elif",
  "else",
  "except",
  "False",
  "finally",
  "for",
  "from",
  "global",
  "if",
  "import",
  "in",
  "is",
  "lambda",
  "None",
  "nonlocal",
  "not",
  "or",
  "pass",
  "raise",
  "return",
  "True",
  "try",
  "while",
  "with",
  "yield",
]);

const isIdentChar = (c: string) => /[a-zA-Z0-9_$]/.test(c);

const tokenizeJsLikeLine = (line: string): CodeToken[] => {
  const tokens: CodeToken[] = [];
  let i = 0;
  const push = (text: string, kind: CodeTokenKind) => {
    if (text) {
      tokens.push({ text, kind });
    }
  };

  while (i < line.length) {
    const c = line[i]!;

    if (c === "/" && line[i + 1] === "/") {
      push(line.slice(i), "comment");
      break;
    }
    if (c === "/" && line[i + 1] === "*") {
      const end = line.indexOf("*/", i + 2);
      if (end === -1) {
        push(line.slice(i), "comment");
        break;
      }
      push(line.slice(i, end + 2), "comment");
      i = end + 2;
      continue;
    }

    if (c === "'" || c === '"') {
      const quote = c;
      let j = i + 1;
      let escaped = false;
      while (j < line.length) {
        if (escaped) {
          escaped = false;
          j++;
          continue;
        }
        if (line[j] === "\\") {
          escaped = true;
          j++;
          continue;
        }
        if (line[j] === quote) {
          j++;
          break;
        }
        j++;
      }
      push(line.slice(i, j), "string");
      i = j;
      continue;
    }

    if (c === "`") {
      let j = i + 1;
      let escaped = false;
      while (j < line.length) {
        if (escaped) {
          escaped = false;
          j++;
          continue;
        }
        if (line[j] === "\\") {
          escaped = true;
          j++;
          continue;
        }
        if (line[j] === "`") {
          j++;
          break;
        }
        j++;
      }
      push(line.slice(i, j), "string");
      i = j;
      continue;
    }

    if (/\d/.test(c) || (c === "." && /\d/.test(line[i + 1] || ""))) {
      // Parse a number token deterministically to avoid false positives such as
      // "1.2.3" or "1e+2+3" being consumed as a single number.
      let j = i;

      while (j < line.length && /\d/.test(line[j]!)) {
        j++;
      }

      if (line[j] === "." && /\d/.test(line[j + 1] || "")) {
        j++; // "."
        while (j < line.length && /\d/.test(line[j]!)) {
          j++;
        }
      }

      if (line[j] === "e" || line[j] === "E") {
        const expStart = j;
        j++; // "e" | "E"

        if (line[j] === "+" || line[j] === "-") {
          j++;
        }

        const expDigitsStart = j;
        while (j < line.length && /\d/.test(line[j]!)) {
          j++;
        }

        // Roll back if exponent has no digits (e.g. "1e", "1e+").
        if (expDigitsStart === j) {
          j = expStart;
        }
      }

      push(line.slice(i, j), "number");
      i = j;
      continue;
    }

    if (isIdentChar(c)) {
      let j = i + 1;
      while (j < line.length && isIdentChar(line[j]!)) {
        j++;
      }
      const word = line.slice(i, j);
      const kind = KEYWORDS_JS.has(word) ? "keyword" : "default";
      push(word, kind);
      i = j;
      continue;
    }

    push(c, "default");
    i++;
  }

  return tokens;
};

const tokenizePyLine = (line: string): CodeToken[] => {
  const tokens: CodeToken[] = [];
  let i = 0;
  const push = (text: string, kind: CodeTokenKind) => {
    if (text) {
      tokens.push({ text, kind });
    }
  };

  while (i < line.length) {
    const c = line[i]!;

    if (c === "#") {
      push(line.slice(i), "comment");
      break;
    }

    if (c === "'" || c === '"') {
      const triple =
        line.slice(i, i + 3) === "'''" || line.slice(i, i + 3) === '"""';
      if (triple) {
        const q = line.slice(i, i + 3);
        const rest = line.indexOf(q, i + 3);
        if (rest === -1) {
          push(line.slice(i), "string");
          break;
        }
        push(line.slice(i, rest + 3), "string");
        i = rest + 3;
        continue;
      }
      const quote = c;
      let j = i + 1;
      let escaped = false;
      while (j < line.length) {
        if (escaped) {
          escaped = false;
          j++;
          continue;
        }
        if (line[j] === "\\") {
          escaped = true;
          j++;
          continue;
        }
        if (line[j] === quote) {
          j++;
          break;
        }
        j++;
      }
      push(line.slice(i, j), "string");
      i = j;
      continue;
    }

    if (/\d/.test(c)) {
      let j = i + 1;
      while (j < line.length && /[0-9.]/.test(line[j]!)) {
        j++;
      }
      push(line.slice(i, j), "number");
      i = j;
      continue;
    }

    if (isIdentChar(c)) {
      let j = i + 1;
      while (j < line.length && isIdentChar(line[j]!)) {
        j++;
      }
      const word = line.slice(i, j);
      const kind = KEYWORDS_PY.has(word) ? "keyword" : "default";
      push(word, kind);
      i = j;
      continue;
    }

    push(c, "default");
    i++;
  }

  return tokens;
};

const normalizeLang = (language: string | null): string | null => {
  if (!language) {
    return null;
  }
  const l = language.trim().toLowerCase();
  if (
    l === "js" ||
    l === "javascript" ||
    l === "ts" ||
    l === "typescript" ||
    l === "tsx" ||
    l === "jsx" ||
    l === "json"
  ) {
    return "js";
  }
  if (l === "py" || l === "python") {
    return "py";
  }
  return null;
};

export const tokenizeCodeLine = (
  line: string,
  language: string | null,
): CodeToken[] => {
  const lang = normalizeLang(language);
  if (!lang) {
    return line ? [{ text: line, kind: "default" }] : [];
  }

  const cacheKey = `${lang}:${line}`;
  const hit = cacheGet(cacheKey);
  if (hit) {
    return hit;
  }

  const tokens =
    lang === "py" ? tokenizePyLine(line) : tokenizeJsLikeLine(line);
  cacheSet(cacheKey, tokens);
  return tokens;
};

export const getTokenColor = (
  kind: CodeTokenKind,
  theme: Theme,
  defaultStroke: string,
): string => {
  const isDark = theme === THEME.DARK;
  switch (kind) {
    case "keyword":
      return isDark ? "#c678dd" : "#6f42c1";
    case "string":
      return isDark ? "#98c379" : "#22863a";
    case "comment":
      return isDark ? "#5c6370" : "#6a737d";
    case "number":
      return isDark ? "#d19a66" : "#005cc5";
    default:
      return defaultStroke;
  }
};
