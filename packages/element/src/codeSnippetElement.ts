import {
  BOUND_TEXT_PADDING,
  FONT_FAMILY,
  THEME,
  applyDarkModeFilter,
  getFontString,
  getVerticalOffset,
  isTransparent,
} from "@excalidraw/common";

import type { StaticCanvasRenderConfig } from "@excalidraw/excalidraw/scene/types";

import { getTokenColor, tokenizeCodeLine } from "./codeHighlight";
import {
  getLineHeightInPx,
  measureText,
  normalizeText,
} from "./textMeasurements";
import { wrapText } from "./textWrapping";

import type { ElementsMap, ExcalidrawCodeElement, Theme } from "./types";

/** Inner padding between box edge and text (scene units). */
export const CODE_SNIPPET_INNER_PADDING = BOUND_TEXT_PADDING;

export const CODE_SNIPPET_DEFAULT_FONT_SIZE = 14;

export const getCodeSnippetFontString = (element: ExcalidrawCodeElement) =>
  getFontString({
    fontFamily: FONT_FAMILY.Cascadia,
    fontSize: element.fontSize,
  });

export const refreshCodeSnippetDimensions = (
  element: ExcalidrawCodeElement,
  _elementsMap: ElementsMap,
  nextOriginalText?: string,
) => {
  if (element.isDeleted) {
    return null;
  }
  const raw = nextOriginalText ?? element.originalText;
  const text = normalizeText(raw);
  const innerWidth = Math.max(
    0,
    element.width - CODE_SNIPPET_INNER_PADDING * 2,
  );
  const wrapped = wrapText(text, getCodeSnippetFontString(element), innerWidth);
  const dimensions = measureText(
    wrapped,
    getCodeSnippetFontString(element),
    element.lineHeight,
  );
  const nextHeight = dimensions.height + CODE_SNIPPET_INNER_PADDING * 2;
  return {
    text: wrapped,
    originalText: text,
    width: element.width,
    height: Math.max(
      nextHeight,
      getLineHeightInPx(element.fontSize, element.lineHeight) +
        CODE_SNIPPET_INNER_PADDING * 2,
    ),
  };
};

export const drawCodeElementOnCanvas = (
  element: ExcalidrawCodeElement,
  context: CanvasRenderingContext2D,
  renderConfig: StaticCanvasRenderConfig,
) => {
  const pad = CODE_SNIPPET_INNER_PADDING;
  const theme = renderConfig.theme;

  if (!isTransparent(element.backgroundColor)) {
    context.fillStyle =
      theme === THEME.DARK
        ? applyDarkModeFilter(element.backgroundColor)
        : element.backgroundColor;
    context.fillRect(0, 0, element.width, element.height);
  }

  const strokeColor =
    theme === THEME.DARK
      ? applyDarkModeFilter(element.strokeColor)
      : element.strokeColor;

  if (element.strokeWidth > 0 && strokeColor && !isTransparent(strokeColor)) {
    context.strokeStyle = strokeColor;
    context.lineWidth = element.strokeWidth;
    context.strokeRect(0, 0, element.width, element.height);
  }

  const font = getCodeSnippetFontString(element);
  context.font = font;
  context.textAlign = "left";

  const defaultFill =
    theme === THEME.DARK
      ? applyDarkModeFilter(element.strokeColor)
      : element.strokeColor;

  const lineHeightPx = getLineHeightInPx(element.fontSize, element.lineHeight);
  const verticalOffset = getVerticalOffset(
    FONT_FAMILY.Cascadia,
    element.fontSize,
    lineHeightPx,
  );
  const lines = element.text.replace(/\r\n?/g, "\n").split("\n");

  let y = pad + verticalOffset;
  for (const line of lines) {
    const tokens = tokenizeCodeLine(line, element.language);
    let x = pad;
    for (const token of tokens) {
      context.fillStyle = getTokenColor(
        token.kind,
        theme as Theme,
        defaultFill,
      );
      context.fillText(token.text, x, y);
      x += context.measureText(token.text).width;
    }
    y += lineHeightPx;
  }
};
