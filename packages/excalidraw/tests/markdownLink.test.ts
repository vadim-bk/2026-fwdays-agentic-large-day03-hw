import { normalizeLink } from "@excalidraw/common";

import { isSafeMarkdownLinkUrl, tryParseMarkdownLink } from "../markdownLink";

describe("tryParseMarkdownLink", () => {
  it("parses a whole-string markdown link", () => {
    expect(tryParseMarkdownLink("[Open Docs](https://example.com)")).toEqual({
      label: "Open Docs",
      url: "https://example.com",
    });
  });

  it("trims surrounding whitespace on the full string", () => {
    expect(tryParseMarkdownLink("  [label](https://a.test)  ")).toEqual({
      label: "label",
      url: "https://a.test",
    });
  });

  it("trims whitespace inside the URL parentheses", () => {
    expect(tryParseMarkdownLink("[x](  https://b.test  )")).toEqual({
      label: "x",
      url: "https://b.test",
    });
  });

  it("allows an empty label", () => {
    expect(tryParseMarkdownLink("[](https://empty-label.com)")).toEqual({
      label: "",
      url: "https://empty-label.com",
    });
  });

  it("returns null for partial inline markdown", () => {
    expect(tryParseMarkdownLink("See [here](https://x.com) for more")).toBe(
      null,
    );
  });

  it("returns null for plain text", () => {
    expect(tryParseMarkdownLink("hello")).toBe(null);
  });

  it("returns null for empty and whitespace-only strings", () => {
    expect(tryParseMarkdownLink("")).toBe(null);
    expect(tryParseMarkdownLink("   ")).toBe(null);
  });

  it("returns null when the pattern is not anchored to the whole string", () => {
    expect(tryParseMarkdownLink("prefix [a](b)")).toBe(null);
    expect(tryParseMarkdownLink("[a](b) suffix")).toBe(null);
  });

  it("returns null for multiline content that is not a single-line link", () => {
    expect(tryParseMarkdownLink("[a](https://x.com)\nextra")).toBe(null);
  });

  it("trims trailing newline so a pasted link with a final newline still parses", () => {
    expect(tryParseMarkdownLink("[a](b)\n")).toEqual({ label: "a", url: "b" });
  });
});

describe("markdown link + normalizeLink (submit behavior)", () => {
  it("blocks javascript URLs so the app should not apply link transform", () => {
    // URL must not contain `)` or the markdown pattern stops at the first `)`.
    const parsed = tryParseMarkdownLink(
      // eslint-disable-next-line no-script-url
      "[x](javascript:void%200)",
    );
    expect(parsed).not.toBeNull();
    const normalized =
      // eslint-disable-next-line no-script-url
      normalizeLink(parsed!.url);
    expect(isSafeMarkdownLinkUrl(normalized)).toBe(false);
  });

  it("accepts https URLs for transform", () => {
    const parsed = tryParseMarkdownLink("[x](https://safe.example/path)");
    expect(parsed).not.toBeNull();
    const normalized = normalizeLink(parsed!.url);
    expect(normalized).toBe("https://safe.example/path");
    expect(isSafeMarkdownLinkUrl(normalized)).toBe(true);
  });
});

describe("isSafeMarkdownLinkUrl", () => {
  it("rejects blank and about:blank", () => {
    expect(isSafeMarkdownLinkUrl("")).toBe(false);
    expect(isSafeMarkdownLinkUrl("  ")).toBe(false);
    expect(isSafeMarkdownLinkUrl("about:blank")).toBe(false);
  });

  it("accepts normal http(s) URLs", () => {
    expect(isSafeMarkdownLinkUrl("https://a.test")).toBe(true);
  });
});
