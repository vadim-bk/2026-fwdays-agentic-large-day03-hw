import { FONT_FAMILY, KEYS, getFontFamilyString } from "@excalidraw/common";

import { refreshCodeSnippetDimensions } from "@excalidraw/element";

import type { ExcalidrawCodeElement } from "@excalidraw/element/types";

import type App from "../components/App";
import type { AppState } from "../types";

const getTransform = (
  width: number,
  height: number,
  angle: number,
  appState: AppState,
  maxWidth: number,
  maxHeight: number,
) => {
  const { zoom } = appState;
  const degree = (180 * angle) / Math.PI;
  let translateX = (width * (zoom.value - 1)) / 2;
  let translateY = (height * (zoom.value - 1)) / 2;
  if (width > maxWidth && zoom.value !== 1) {
    translateX = (maxWidth * (zoom.value - 1)) / 2;
  }
  if (height > maxHeight && zoom.value !== 1) {
    translateY = (maxHeight * (zoom.value - 1)) / 2;
  }
  return `translate(${translateX}px, ${translateY}px) scale(${zoom.value}) rotate(${degree}deg)`;
};

export const codeSnippetWysiwyg = ({
  id,
  app,
  canvas,
  getViewportCoords,
  excalidrawContainer,
  onSubmit,
}: {
  id: ExcalidrawCodeElement["id"];
  app: App;
  canvas: HTMLCanvasElement;
  getViewportCoords: (x: number, y: number) => [number, number];
  excalidrawContainer: HTMLDivElement | null;
  onSubmit: (data: { viaKeyboard: boolean; nextOriginalText: string }) => void;
}): (() => void) => {
  let element = app.scene.getElement(id) as ExcalidrawCodeElement | null;
  if (!element || element.type !== "code") {
    return () => undefined;
  }

  let destroyed = false;
  let submittedViaKeyboard = false;
  let focusTimerId: number | null = null;

  const wrapper = document.createElement("div");
  wrapper.className = "excalidraw-code-editor";
  Object.assign(wrapper.style, {
    position: "absolute",
    zIndex: "var(--zIndex-wysiwyg)",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    margin: 0,
    padding: "4px",
    background: "var(--island-bg-color)",
    borderRadius: "4px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
  });

  const textarea = document.createElement("textarea");
  textarea.dataset.type = "code-snippet-editor";
  textarea.value = element.originalText;
  textarea.spellcheck = false;
  Object.assign(textarea.style, {
    flex: "1",
    width: "100%",
    minHeight: "3em",
    margin: 0,
    padding: "4px",
    border: "1px solid var(--color-gray-30)",
    borderRadius: "2px",
    resize: "none",
    fontFamily: getFontFamilyString({ fontFamily: FONT_FAMILY.Cascadia }),
    fontSize: `${element.fontSize}px`,
    lineHeight: `${element.lineHeight}`,
    whiteSpace: "pre-wrap",
    overflow: "auto",
    boxSizing: "border-box",
    background: "var(--dialog-bg-color)",
    color: "var(--text-primary-color)",
  });

  wrapper.append(textarea);

  const updateFromElement = () => {
    const el = app.scene.getElement(id) as ExcalidrawCodeElement | null;
    if (!el || el.type !== "code") {
      return;
    }
    element = el;
    const [vx, vy] = getViewportCoords(element.x, element.y);
    const appState = app.state;
    const maxWidth = appState.width;
    const maxHeight = appState.height;
    Object.assign(wrapper.style, {
      transform: getTransform(
        element.width,
        element.height,
        element.angle,
        appState,
        maxWidth,
        maxHeight,
      ),
      width: `${element.width}px`,
      minHeight: `${element.height}px`,
      left: `${vx - appState.offsetLeft}px`,
      top: `${vy - appState.offsetTop}px`,
    });
    textarea.style.fontSize = `${element.fontSize}px`;
    textarea.style.fontFamily = getFontFamilyString({
      fontFamily: FONT_FAMILY.Cascadia,
    });
  };

  const applyText = (next: string) => {
    if (destroyed) {
      return;
    }
    const el = app.scene.getElement(id) as ExcalidrawCodeElement | null;
    if (!el || el.type !== "code") {
      return;
    }
    const dims = refreshCodeSnippetDimensions(
      el,
      app.scene.getNonDeletedElementsMap(),
      next,
    );
    if (!dims) {
      return;
    }
    app.scene.mutateElement(el, dims);
    updateFromElement();
  };

  textarea.oninput = () => {
    applyText(textarea.value);
  };

  const handleSubmit = () => {
    if (destroyed) {
      return;
    }
    destroyed = true;
    const nextOriginalText = textarea.value;
    cleanup();
    onSubmit({ viaKeyboard: submittedViaKeyboard, nextOriginalText });
  };

  const cleanup = () => {
    if (focusTimerId !== null) {
      window.clearTimeout(focusTimerId);
      focusTimerId = null;
    }
    textarea.oninput = null;
    textarea.onkeydown = null;
    window.removeEventListener("pointerdown", onPointerDown, {
      capture: true,
    });
    window.removeEventListener("resize", updateFromElement);
    wrapper.remove();
  };

  const onPointerDown = (event: PointerEvent) => {
    if (event.target instanceof Node && wrapper.contains(event.target)) {
      return;
    }
    handleSubmit();
  };

  const parent = excalidrawContainer || canvas.parentElement;
  parent?.appendChild(wrapper);
  updateFromElement();

  // Defer so we do not handle the same pointerdown that created the snippet
  // (mirrors textWysiwyg).
  requestAnimationFrame(() => {
    window.addEventListener("pointerdown", onPointerDown, { capture: true });
  });
  window.addEventListener("resize", updateFromElement);

  textarea.onkeydown = (event) => {
    if (event.key === KEYS.ESCAPE) {
      event.stopPropagation();
      submittedViaKeyboard = true;
      handleSubmit();
    }
    if (event.key === "Tab") {
      event.preventDefault();
      const { selectionStart, selectionEnd, value } = textarea;
      textarea.value = `${value.slice(0, selectionStart)}\t${value.slice(
        selectionEnd,
      )}`;
      const pos = selectionStart + 1;
      textarea.selectionStart = textarea.selectionEnd = pos;
      applyText(textarea.value);
    }
  };

  focusTimerId = window.setTimeout(() => {
    focusTimerId = null;
    if (destroyed) {
      return;
    }
    if (!textarea.isConnected) {
      return;
    }
    textarea.focus();
    textarea.select();
  }, 0);

  return handleSubmit;
};
