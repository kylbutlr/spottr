import { getNote } from "./shared/storage.js";

const $ = (selector) => document.querySelector(selector);

function showError(message) {
  $("#status").textContent = message;
  $("#status").classList.add("error");
}

async function loadViewer() {
  const noteId = new URLSearchParams(location.search).get("noteId");
  if (!noteId) {
    showError("This screenshot link is missing its note ID.");
    return;
  }

  const note = await getNote(noteId);
  if (!note?.screenshot?.data) {
    showError("That screenshot is no longer available in local storage.");
    return;
  }

  const projectName = note.projectName || "QA note";
  document.title = `${projectName} screenshot | Spottr`;
  $("#project").textContent = projectName;
  $("#meta").textContent = `${note.environment || "Unknown environment"} · ${note.runLabel || "Unlabeled run"}`;
  $("#message").textContent = note.message || "No note text";

  const screenshot = $("#screenshot");
  screenshot.src = note.screenshot.data;
  screenshot.alt = `Screenshot for ${note.message || "QA note"}`;

  if (note.url) {
    const source = $("#source");
    source.href = note.url;
    source.hidden = false;
  }

  $("#status").hidden = true;
  $("#viewer").hidden = false;
}

void loadViewer().catch((error) => {
  showError(error instanceof Error ? error.message : "Could not load the screenshot.");
});
