const $ = (selector) => document.querySelector(selector);

function send(message) {
  return chrome.runtime.sendMessage(message).then((response) => {
    if (!response?.ok) throw new Error(response?.error || "Spottr failed.");
    return response.result;
  });
}

function renderShortcut(shortcut) {
  return String(shortcut || "Not set")
    .replaceAll("Command", "⌘")
    .replaceAll("MacCtrl", "⌃")
    .replaceAll("Ctrl", "⌃")
    .replaceAll("Shift", "⇧")
    .replaceAll("Option", "⌥")
    .replaceAll("Alt", "⌥")
    .replaceAll("+", " ");
}

const cleanupActions = {
  session: null,
  project: null
};

function setCleanupAction(scope, action) {
  const control = $(`#clear-${scope}`);
  cleanupActions[scope] = action;
  control.hidden = !action;
  if (action) control.textContent = action.label;
}

function renderWorkspace(workspace) {
  const NEW_PROJECT_VALUE = "__new_project__";
  const NEW_SESSION_VALUE = "__new_session__";
  const projectSelect = $("#project-select");
  projectSelect.replaceChildren();
  const projects = [...workspace.projects].sort((a, b) => a.name.localeCompare(b.name));
  const activeProject = projects.find((project) => project.id === workspace.activeContext.projectId);
  if (!activeProject) {
    const option = document.createElement("option");
    option.textContent = workspace.activeContext.draft
      ? `New project: ${workspace.target.projectName} (in progress)`
      : (projects.length ? `Current target: ${workspace.target.projectName} (unsaved)` : "No saved projects yet");
    option.disabled = true;
    option.selected = true;
    projectSelect.append(option);
  }
  for (const project of projects) {
    const option = document.createElement("option");
    option.value = project.id;
    option.textContent = project.name;
    projectSelect.append(option);
  }
  const newProjectOption = document.createElement("option");
  newProjectOption.value = NEW_PROJECT_VALUE;
  newProjectOption.textContent = "+ Create new project...";
  projectSelect.append(newProjectOption);
  if (activeProject) projectSelect.value = workspace.activeContext.projectId;
  projectSelect.dataset.currentValue = activeProject ? workspace.activeContext.projectId : "";

  const sessionSelect = $("#session-select");
  sessionSelect.replaceChildren();
  const activeSession = activeProject?.sessions.find((session) => session.id === workspace.activeContext.sessionId);
  if (!activeSession) {
    const option = document.createElement("option");
    option.textContent = `New session: ${workspace.target.runLabel} (in progress)`;
    option.disabled = true;
    option.selected = true;
    sessionSelect.append(option);
  }
  for (const session of [...(activeProject?.sessions || [])].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))) {
    const option = document.createElement("option");
    option.value = session.id;
    option.textContent = session.label;
    sessionSelect.append(option);
  }
  const newSessionOption = document.createElement("option");
  newSessionOption.value = NEW_SESSION_VALUE;
  newSessionOption.textContent = "+ Create new session...";
  sessionSelect.append(newSessionOption);
  if (activeSession) sessionSelect.value = workspace.activeContext.sessionId;
  sessionSelect.dataset.currentValue = activeSession ? workspace.activeContext.sessionId : "";
  $("#target-context").textContent = `${workspace.target.projectName} · ${workspace.target.environment} · ${workspace.target.runLabel}`;
  $("#first-use").hidden = workspace.totalNoteCount > 0;

  setCleanupAction("session", activeSession
    ? workspace.sessionNoteCount > 0
      ? {
          label: "Clear session notes",
          type: "qa-clear-session",
          confirm: "Clear all notes from this QA session? This cannot be undone.",
          result: ({ removed }) => `Cleared ${removed} ${removed === 1 ? "note" : "notes"}.`
        }
      : {
          label: "Delete empty session",
          type: "qa-delete-session",
          confirm: `Delete the empty QA session “${activeSession.label}”?`,
          result: () => "Empty QA session deleted."
        }
    : null);

  setCleanupAction("project", activeProject
    ? workspace.projectNoteCount > 0
      ? {
          label: "Clear project notes",
          type: "qa-clear-project",
          confirm: "Clear all notes from this project? This cannot be undone.",
          result: ({ removed }) => `Cleared ${removed} ${removed === 1 ? "note" : "notes"}.`
        }
      : {
          label: "Delete empty project",
          type: "qa-delete-project",
          confirm: `Delete the empty project “${activeProject.name}” and its empty sessions?`,
          result: () => "Empty project deleted."
        }
    : null);
  $(".cleanup-actions").hidden = !cleanupActions.session && !cleanupActions.project;
}

function renderNotes(notes, workspace) {
  $("#note-count").textContent = String(notes.length);
  $("#empty").hidden = notes.length > 0;
  const list = $("#notes");
  list.replaceChildren();

  for (const note of [...notes].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))) {
    const item = document.createElement("li");
    const imageButton = document.createElement("button");
    imageButton.className = "note-image-button";
    imageButton.type = "button";
    imageButton.setAttribute("aria-label", "View screenshot");
    const image = document.createElement("img");
    image.className = "note-image";
    image.alt = `Screenshot for ${note.message || "QA note"}`;
    image.loading = "lazy";
    if (note.screenshot?.data) {
      image.src = note.screenshot.data;
      imageButton.append(image);
      imageButton.setAttribute("aria-label", "Open screenshot in a new tab");
      imageButton.title = "Open screenshot in a new tab";
      imageButton.addEventListener("click", () => {
        const viewerUrl = new URL(chrome.runtime.getURL("viewer.html"));
        viewerUrl.searchParams.set("noteId", note.id);
        void chrome.tabs.create({ url: viewerUrl.toString() });
      });
    } else {
      imageButton.hidden = true;
    }

    const noteHeader = document.createElement("div");
    noteHeader.className = "note-header";
    const message = document.createElement("p");
    message.className = "note-message";
    message.textContent = note.message;
    const meta = document.createElement("small");
    meta.className = "note-meta";
    meta.textContent = `${note.projectName} · ${note.runLabel}`;
    const remove = document.createElement("button");
    remove.className = "note-delete text-button danger";
    remove.type = "button";
    remove.textContent = "Delete";
    remove.addEventListener("click", async () => {
      if (!window.confirm("Delete this note and its screenshot? This cannot be undone.")) return;
      remove.disabled = true;
      try {
        await send({ type: "qa-delete-note", noteId: note.id });
        $("#status").textContent = "Note deleted.";
        await refresh();
      } catch (error) {
        remove.disabled = false;
        $("#status").textContent = error instanceof Error ? error.message : "Could not delete the note.";
      }
    });
    const actions = document.createElement("div");
    actions.className = "note-actions";
    const move = document.createElement("button");
    move.className = "note-move text-button";
    move.type = "button";
    move.textContent = "Move";
    move.setAttribute("aria-expanded", "false");

    const movePanel = document.createElement("div");
    movePanel.className = "note-move-panel";
    movePanel.hidden = true;
    const projectField = document.createElement("label");
    projectField.className = "move-field";
    projectField.textContent = "Destination project";
    const projectSelect = document.createElement("select");
    projectSelect.setAttribute("aria-label", "Destination project");
    for (const project of [...workspace.projects].sort((a, b) => a.name.localeCompare(b.name))) {
      const option = document.createElement("option");
      option.value = project.id;
      option.textContent = project.name;
      projectSelect.append(option);
    }
    const newProjectOption = document.createElement("option");
    newProjectOption.value = "__new_project__";
    newProjectOption.textContent = "Create new project...";
    projectSelect.append(newProjectOption);
    projectField.append(projectSelect);

    const sessionField = document.createElement("label");
    sessionField.className = "move-field";
    sessionField.textContent = "Destination session";
    const sessionSelect = document.createElement("select");
    sessionSelect.setAttribute("aria-label", "Destination session");
    sessionField.append(sessionSelect);

    const newProjectField = document.createElement("label");
    newProjectField.className = "move-field";
    newProjectField.textContent = "New project name";
    const newProjectInput = document.createElement("input");
    newProjectInput.placeholder = "Project name";
    newProjectInput.setAttribute("aria-label", "New project name");
    newProjectField.append(newProjectInput);

    const moveActions = document.createElement("div");
    moveActions.className = "editor-actions";
    const cancelMove = document.createElement("button");
    cancelMove.className = "text-button";
    cancelMove.type = "button";
    cancelMove.textContent = "Cancel";
    const confirmMove = document.createElement("button");
    confirmMove.className = "primary compact";
    confirmMove.type = "button";
    confirmMove.textContent = "Move note";
    moveActions.append(cancelMove, confirmMove);

    function renderMoveDestination() {
      const isNewProject = projectSelect.value === "__new_project__";
      sessionField.hidden = isNewProject;
      newProjectField.hidden = !isNewProject;
      sessionSelect.replaceChildren();
      if (isNewProject) return;
      const project = workspace.projects.find((candidate) => candidate.id === projectSelect.value);
      for (const session of [...(project?.sessions || [])].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))) {
        const option = document.createElement("option");
        option.value = session.id;
        option.textContent = session.label;
        sessionSelect.append(option);
      }
    }

    projectSelect.addEventListener("change", renderMoveDestination);
    move.addEventListener("click", () => {
      const open = movePanel.hidden;
      movePanel.hidden = !open;
      move.textContent = open ? "Cancel move" : "Move";
      move.setAttribute("aria-expanded", String(open));
      if (open) renderMoveDestination();
    });
    cancelMove.addEventListener("click", () => {
      movePanel.hidden = true;
      move.textContent = "Move";
      move.setAttribute("aria-expanded", "false");
    });
    confirmMove.addEventListener("click", async () => {
      const isNewProject = projectSelect.value === "__new_project__";
      if (isNewProject && !newProjectInput.value.trim()) {
        newProjectInput.focus();
        return;
      }
      confirmMove.disabled = true;
      try {
        await send({
          type: "qa-move-note",
          noteId: note.id,
          destinationProjectId: isNewProject ? undefined : projectSelect.value,
          destinationSessionId: isNewProject ? undefined : sessionSelect.value,
          newProjectName: isNewProject ? newProjectInput.value : undefined
        });
        $("#status").textContent = "Note moved.";
        await refresh();
      } catch (error) {
        confirmMove.disabled = false;
        $("#status").textContent = error instanceof Error ? error.message : "Could not move the note.";
      }
    });
    movePanel.append(projectField, sessionField, newProjectField, moveActions);
    actions.append(move, remove);
    noteHeader.append(meta, actions);
    item.append(imageButton, message, noteHeader, movePanel);
    list.append(item);
  }
}

async function exportPayload() {
  return send({ type: "qa-export" });
}

function exportJson(payload) {
  return JSON.stringify(payload, null, 2);
}

async function refresh() {
  const [dashboard, shortcutState] = await Promise.all([
    send({ type: "qa-get-dashboard" }),
    send({ type: "qa-get-shortcuts" })
  ]);
  renderWorkspace(dashboard);
  $("#shortcut").textContent = renderShortcut(shortcutState.capture);
  $("#note-shortcut").textContent = renderShortcut(shortcutState.note);
  renderNotes(dashboard.notes, dashboard);
}

let editorMode = null;

function openEditor(mode) {
  editorMode = mode;
  const editor = $("#workspace-editor");
  const input = $("#workspace-name");
  const project = mode === "project";
  $("#editor-label").textContent = project ? "NEW PROJECT" : "NEW QA SESSION";
  input.value = "";
  input.placeholder = project ? "Project name" : "Session label (optional)";
  input.setAttribute("aria-label", project ? "Project name" : "Session label");
  editor.hidden = false;
  input.focus();
}

function closeEditor(event) {
  event?.preventDefault();
  editorMode = null;
  $("#workspace-editor").hidden = true;
  $("#workspace-name").value = "";
}

async function saveEditor() {
  if (!editorMode) return;
  const project = editorMode === "project";
  const message = editorMode === "project"
    ? { type: "qa-create-project", name: $("#workspace-name").value }
    : { type: "qa-create-session", label: $("#workspace-name").value };
  try {
    await send(message);
    closeEditor();
    $("#status").textContent = project ? "Project created." : "New QA session started.";
    await refresh();
  } catch (error) {
    $("#status").textContent = error instanceof Error ? error.message : "Could not update the workspace.";
  }
}

$("#project-select").addEventListener("change", async (event) => {
  if (event.target.value === "__new_project__") {
    event.target.value = event.target.dataset.currentValue || "";
    openEditor("project");
    return;
  }
  event.target.dataset.currentValue = event.target.value;
  try {
    await send({ type: "qa-select-project", projectId: event.target.value });
    $("#status").textContent = "Project switched.";
    await refresh();
  } catch (error) {
    $("#status").textContent = error instanceof Error ? error.message : "Could not switch projects.";
  }
});

$("#session-select").addEventListener("change", async (event) => {
  if (event.target.value === "__new_session__") {
    event.target.value = event.target.dataset.currentValue || "";
    openEditor("session");
    return;
  }
  event.target.dataset.currentValue = event.target.value;
  try {
    await send({ type: "qa-select-session", sessionId: event.target.value });
    $("#status").textContent = "QA session switched.";
    await refresh();
  } catch (error) {
    $("#status").textContent = error instanceof Error ? error.message : "Could not switch QA sessions.";
  }
});

$("#cancel-editor").addEventListener("click", (event) => {
  event.preventDefault();
  closeEditor();
});
$("#save-editor").addEventListener("click", () => void saveEditor());
$("#workspace-name").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    void saveEditor();
  }
  if (event.key === "Escape") closeEditor(event);
});

async function runCleanup(scope) {
  const action = cleanupActions[scope];
  if (!action || !window.confirm(action.confirm)) return;
  const control = $(`#clear-${scope}`);
  control.disabled = true;
  try {
    const result = await send({ type: action.type });
    $("#status").textContent = action.result(result);
    await refresh();
  } catch (error) {
    $("#status").textContent = error instanceof Error ? error.message : "Could not update this workspace.";
  } finally {
    control.disabled = false;
  }
}

$("#clear-session").addEventListener("click", () => void runCleanup("session"));
$("#clear-project").addEventListener("click", () => void runCleanup("project"));

$("#capture").addEventListener("click", async () => {
  try {
    await send({ type: "qa-start-capture" });
    window.close();
  } catch (error) {
    $("#status").textContent = error instanceof Error ? error.message : "Could not start capture.";
  }
});

$("#note-only").addEventListener("click", async () => {
  try {
    await send({ type: "qa-start-note" });
    window.close();
  } catch (error) {
    $("#status").textContent = error instanceof Error ? error.message : "Could not start a note.";
  }
});

$("#configure-shortcut").addEventListener("click", () => {
  void chrome.runtime.openOptionsPage();
});

$("#copy-json").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(exportJson(await exportPayload()));
    $("#status").textContent = "JSON copied to clipboard.";
  } catch (error) {
    $("#status").textContent = `Could not copy JSON. Use Export JSON instead. ${error instanceof Error ? error.message : ""}`.trim();
  }
});

$("#export").addEventListener("click", async () => {
  try {
    const blob = new Blob([exportJson(await exportPayload())], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `spottr-qa-notes-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    $("#status").textContent = "JSON export downloaded.";
  } catch (error) {
    $("#status").textContent = `Could not download the JSON export. Try Copy JSON instead. ${error instanceof Error ? error.message : ""}`.trim();
  }
});

void refresh().catch((error) => {
  $("#status").textContent = error instanceof Error ? error.message : "Could not load local notes.";
});
