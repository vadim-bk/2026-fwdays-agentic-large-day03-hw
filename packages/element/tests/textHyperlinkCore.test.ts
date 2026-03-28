import { describe, expect, it } from "vitest";

import {
  isValidTextHyperlinkUrl,
  parseTextHyperlinkCandidates,
  toTextMeasurementLine,
} from "../src/textHyperlinkCore";

describe("textHyperlinkCore", () => {
  it("parses a valid markdown link", () => {
    const parts = parseTextHyperlinkCandidates("hi [doc](https://ex.io/a) there");
    expect(parts).toHaveLength(3);
    expect(parts[0]).toMatchObject({ type: "plain", start: 0, end: 3 });
    expect(parts[1]).toMatchObject({
      type: "link",
      label: "doc",
      urlRaw: "https://ex.io/a",
    });
    expect(parts[2]).toMatchObject({ type: "plain" });
  });

  it("treats unclosed bracket as plain", () => {
    const parts = parseTextHyperlinkCandidates("a [b c");
    expect(parts.every((p) => p.type === "plain")).toBe(true);
  });

  it("rejects javascript URLs for measurement and validation", () => {
    expect(isValidTextHyperlinkUrl("javascript:alert(1)")).toBeNull();
    const line = toTextMeasurementLine("[x](javascript:alert(1))");
    expect(line).toBe("[x](javascript:alert(1))");
  });

  it("uses label width string for valid links", () => {
    expect(toTextMeasurementLine("see [here](https://a.com) now")).toBe(
      "see here now",
    );
  });
});
