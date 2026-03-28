import { THEME, applyDarkModeFilter } from "@excalidraw/common";
import { pointFrom, pointRotateRads, type Radians } from "@excalidraw/math";

import { LinearElementEditor } from "./linearElementEditor";
import { getContainerElement } from "./textElement";
import { getLineHeightInPx } from "./textMeasurements";
import { expandLineToHyperlinkWidthUnits } from "./textWrapping";
import { isArrowElement } from "./typeChecks";

import type {
  ExcalidrawTextElement,
  ExcalidrawTextElementWithContainer,
} from "./types";
import type { FontString } from "./types";
import type { GlobalPoint } from "@excalidraw/math";
import type { ElementsMap } from "./types";

/** Default hyperlink color (matches element link icon stroke). */
export const TEXT_HYPERLINK_COLOR = "#1971c2";

export type TextLineDrawSegment = {
  text: string;
  xOffset: number;
  width: number;
  normalizedUrl: string | null;
};

export const getTextLineDrawSegments = (
  line: string,
  font: FontString,
  element: Pick<
    ExcalidrawTextElement,
    "width" | "textAlign" | "fontFamily" | "fontSize" | "lineHeight"
  >,
): TextLineDrawSegment[] => {
  const units = expandLineToHyperlinkWidthUnits(line, font, 0);
  const totalWidth = units.reduce((s, u) => s + u.width, 0);
  const horizontalOffset =
    element.textAlign === "center"
      ? element.width / 2
      : element.textAlign === "right"
        ? element.width
        : 0;
  const textBlockLeft =
    element.textAlign === "center"
      ? horizontalOffset - totalWidth / 2
      : element.textAlign === "right"
        ? horizontalOffset - totalWidth
        : horizontalOffset;

  let x = textBlockLeft;
  const segments: TextLineDrawSegment[] = [];
  for (const u of units) {
    const displayText = u.normalizedUrl
      ? u.source.slice(
          u.source.indexOf("[") + 1,
          u.source.indexOf("]("),
        )
      : u.source;
    segments.push({
      text: displayText,
      xOffset: x,
      width: u.width,
      normalizedUrl: u.normalizedUrl,
    });
    x += u.width;
  }
  return segments;
};

export const getTextHyperlinkRectsInLocalSpace = (
  element: ExcalidrawTextElement,
  font: FontString,
  theme: typeof THEME.LIGHT | typeof THEME.DARK,
): Array<{
  normalizedUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
}> => {
  void theme;
  const lines = element.text.replace(/\r\n?/g, "\n").split("\n");
  const lineHeightPx = getLineHeightInPx(element.fontSize, element.lineHeight);

  const boxes: Array<{
    normalizedUrl: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }> = [];

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    const yTop = lineIndex * lineHeightPx;
    const segments = getTextLineDrawSegments(line, font, element);

    for (const seg of segments) {
      if (!seg.normalizedUrl) {
        continue;
      }
      boxes.push({
        normalizedUrl: seg.normalizedUrl,
        x: seg.xOffset,
        y: yTop,
        width: seg.width,
        height: lineHeightPx,
      });
    }
  }

  return boxes;
};

/**
 * Scene coordinates → unrotated element-local (0…width, 0…height) as used when rasterizing text.
 */
export const scenePointToTextElementLocal = (
  sceneX: number,
  sceneY: number,
  element: ExcalidrawTextElement,
  elementsMap: ElementsMap | null,
): { x: number; y: number } => {
  let x = element.x;
  let y = element.y;
  if (elementsMap && element.containerId) {
    const container = getContainerElement(element, elementsMap);
    if (container && isArrowElement(container)) {
      const pos = LinearElementEditor.getBoundTextElementPosition(
        container,
        element as ExcalidrawTextElementWithContainer,
        elementsMap,
      );
      x = pos.x;
      y = pos.y;
    }
  }

  const cx = x + element.width / 2;
  const cy = y + element.height / 2;
  const rotated = pointRotateRads(
    pointFrom(sceneX, sceneY),
    pointFrom(cx, cy),
    -element.angle as Radians,
  );
  return {
    x: rotated[0] - x,
    y: rotated[1] - y,
  };
};

export const getInlineTextHyperlinkAtScenePoint = (
  element: ExcalidrawTextElement,
  elementsMap: ElementsMap | null,
  scenePoint: GlobalPoint,
  font: FontString,
  theme: typeof THEME.LIGHT | typeof THEME.DARK,
): string | null => {
  const local = scenePointToTextElementLocal(
    scenePoint[0],
    scenePoint[1],
    element,
    elementsMap,
  );

  if (
    local.x < 0 ||
    local.y < 0 ||
    local.x > element.width ||
    local.y > element.height
  ) {
    return null;
  }

  const rects = getTextHyperlinkRectsInLocalSpace(element, font, theme);
  for (const r of rects) {
    if (
      local.x >= r.x &&
      local.x <= r.x + r.width &&
      local.y >= r.y &&
      local.y <= r.y + r.height
    ) {
      return r.normalizedUrl;
    }
  }
  return null;
};

export const getLinkFillColor = (
  _strokeColor: string,
  theme: typeof THEME.LIGHT | typeof THEME.DARK,
): string => {
  const base = TEXT_HYPERLINK_COLOR;
  return theme === THEME.DARK ? applyDarkModeFilter(base) : base;
};
