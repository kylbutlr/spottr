import { deleteCaptureDraft } from "./shared/storage.js";
import { mapDisplaySelection } from "./shared/capture-geometry.js";

const $ = (selector) => document.querySelector(selector);
const captureId = new URLSearchParams(location.search).get("id");
const stage = $("#capture-stage");
const image = $("#screenshot");
const selection = $("#selection");
const status = $("#status");
let draft;
let workspace;
let start;

function setStatus(message) { status.textContent = message; }

function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(value, maximum)); }

function point(event) {
  const bounds = image.getBoundingClientRect();
  return {
    x: clamp(event.clientX - bounds.left, 0, bounds.width),
    y: clamp(event.clientY - bounds.top, 0, bounds.height)
  };
}

function showSelection(first, last) {
  const x = Math.min(first.x, last.x);
  const y = Math.min(first.y, last.y);
  const width = Math.abs(last.x - first.x);
  const height = Math.abs(last.y - first.y);
  Object.assign(selection.style, { left: `${x}px`, top: `${y}px`, width: `${width}px`, height: `${height}px` });
  selection.hidden = false;
  return { x, y, width, height };
}

function selectedCapture(displaySelection) {
  const bounds = image.getBoundingClientRect();
  const sourceWidth = draft.tabWidth || image.naturalWidth;
  const sourceHeight = draft.tabHeight || image.naturalHeight;
  const viewport = draft.tabWidth && draft.tabHeight
    ? { width: draft.tabWidth, height: draft.tabHeight, devicePixelRatio: image.naturalWidth / draft.tabWidth }
    : null;
  return {
    pageUrl: $("#page-url").value.trim(),
    pageTitle: $("#page-title").value.trim(),
    viewport,
    scroll: null,
    sourceViewport: { width: sourceWidth, height: sourceHeight },
    selection: mapDisplaySelection(displaySelection, bounds, { width: sourceWidth, height: sourceHeight })
  };
}

async function finishNote() {
  draft = null;
  stage.hidden = true;
  $("#use-full").disabled = true;
  try {
    await deleteCaptureDraft(captureId);
    setStatus("Note saved. Return to Spottr to review or export it.");
  } catch {
    setStatus("Note saved, but Spottr could not clear the temporary draft. Discard it here or start another capture.");
    draft = { id: captureId };
  }
}

function openTextComposer() {
  if (!draft || !workspace) return;
  void window.__spottrShowComposer({
    screenshot: null,
    capture: {
      pageUrl: $("#page-url").value.trim(),
      pageTitle: $("#page-title").value.trim(),
      viewport: null,
      scroll: null,
      selection: null
    },
    target: workspace.target,
    workspace,
    onSaved: finishNote
  });
}

function openComposer(displaySelection) {
  if (!draft || !workspace) return;
  if (displaySelection.width < 8 || displaySelection.height < 8) {
    setStatus("Drag a larger area, or choose Use full screenshot.");
    return;
  }
  setStatus("Add your note and confirm its project and QA session.");
  void window.__spottrShowComposer({
    screenshot: draft.screenshot,
    capture: selectedCapture(displaySelection),
    target: workspace.target,
    workspace,
    onSaved: finishNote
  });
}

stage.addEventListener("pointerdown", (event) => {
  if (!draft) return;
  start = point(event);
  stage.setPointerCapture(event.pointerId);
  showSelection(start, start);
});
stage.addEventListener("pointermove", (event) => {
  if (start) showSelection(start, point(event));
});
stage.addEventListener("pointerup", (event) => {
  if (!start) return;
  const rectangle = showSelection(start, point(event));
  start = null;
  selection.hidden = true;
  openComposer(rectangle);
});
stage.addEventListener("pointercancel", () => { start = null; selection.hidden = true; });
$("#use-full").addEventListener("click", () => {
  if (!draft?.screenshot) return openTextComposer();
  const bounds = image.getBoundingClientRect();
  openComposer({ x: 0, y: 0, width: bounds.width, height: bounds.height });
});
$("#discard").addEventListener("click", async () => {
  try {
    if (captureId) await deleteCaptureDraft(captureId);
    draft = null;
    stage.hidden = true;
    $("#use-full").disabled = true;
    setStatus("Screenshot discarded. Return to the page to start another capture.");
  } catch {
    setStatus("Spottr could not discard this screenshot. Reload this tab and try again.");
  }
});

try {
  if (!captureId) throw new Error("No screenshot was requested. Return to the page and choose Capture area.");
  const response = await chrome.runtime.sendMessage({ type: "qa-get-restricted-capture", id: captureId });
  if (!response?.ok) throw new Error(response?.error || "Could not load this screenshot.");
  ({ draft, workspace } = response.result);
  $("#page-url").value = draft.pageUrl;
  $("#page-title").value = draft.pageTitle;
  if (draft.screenshot) {
    image.src = draft.screenshot;
    await image.decode();
    stage.hidden = false;
    setStatus("Drag over the screenshot to select an area. Chrome may hide the source URL and title; add them above if needed.");
  } else {
    document.querySelector("h1").textContent = "Add a text-only note for this page";
    $("#use-full").textContent = "Continue to note";
    $("#discard").textContent = "Discard draft";
    setStatus("Chrome may hide the source URL and title. Add them above if needed, then continue to your note.");
  }
} catch (error) {
  setStatus(error instanceof Error ? error.message : "Could not load this screenshot.");
  $("#use-full").disabled = true;
}
