import { createNote, createProject, createQaExport, createSession, createTarget, deriveTarget, reassignNote } from "./shared/model.js";
import { deleteNote, deleteNotesWhere, getActiveContext, getNote, getProjects, listNotes, putNote, setActiveContext, setProjects } from "./shared/storage.js";
import { assignNoteDraft, reconcileWorkspaceProjects, removeProjectIfEmpty, removeSessionIfEmpty } from "./shared/workspace.js";

const TARGET_OVERRIDE_KEY = "targetOverride";

void chrome.storage.local.setAccessLevel?.({ accessLevel: "TRUSTED_CONTEXTS" }).catch(() => undefined);

function latestSession(project) {
  return [...(project?.sessions || [])].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))[0];
}

function targetForWorkspace(pageUrl, workspace) {
  const derived = deriveTarget(pageUrl);
  const project = workspace.projects.find((candidate) => candidate.id === workspace.activeContext.projectId);
  const session = project?.sessions.find((candidate) => candidate.id === workspace.activeContext.sessionId);
  return createTarget({
    projectId: project?.id || workspace.activeContext.projectId || derived.projectId,
    projectName: project?.name || workspace.activeContext.projectName || derived.projectName,
    environment: derived.environment,
    runId: session?.id || workspace.activeContext.sessionId || derived.runId,
    runLabel: session?.label || workspace.activeContext.sessionLabel || derived.runLabel
  });
}

async function ensureWorkspace(pageUrl) {
  const [stored, notes, legacyResult] = await Promise.all([
    Promise.all([getProjects(), getActiveContext()]),
    listNotes(),
    chrome.storage.local.get(TARGET_OVERRIDE_KEY)
  ]);
  let [projects, activeContext] = stored;
  const legacyOverride = legacyResult[TARGET_OVERRIDE_KEY];
  const reconciled = reconcileWorkspaceProjects(projects, notes, legacyOverride);
  projects = reconciled.projects;
  let changed = reconciled.changed;
  const derived = deriveTarget(pageUrl);

  const currentProject = projects.find((project) => project.id === derived.projectId);

  const activeProject = projects.find((project) => project.id === activeContext?.projectId);
  const activeSession = activeProject?.sessions.find((session) => session.id === activeContext?.sessionId);
  if (activeProject && activeSession && (activeContext?.draft || activeContext?.draftSession)) {
    activeContext = { projectId: activeContext.projectId, sessionId: activeContext.sessionId };
    changed = true;
  }
  if (!activeProject || !activeSession) {
    if ((activeContext?.draft || activeContext?.draftSession) && activeContext.projectId && activeContext.sessionId) {
      activeContext = {
        ...activeContext,
        projectName: activeContext.projectName || derived.projectName,
        sessionLabel: activeContext.sessionLabel || derived.runLabel
      };
    } else {
      const preferredProject = legacyOverride?.projectId
        ? projects.find((project) => project.id === legacyOverride.projectId)
        : activeProject || currentProject;
      const project = preferredProject;
      if (project) {
        const session = latestSession(project);
        activeContext = session
          ? { projectId: project.id, sessionId: session.id }
          : {
              projectId: project.id,
              sessionId: derived.runId,
              projectName: project.name,
              sessionLabel: derived.runLabel,
              draftSession: true
            };
      } else {
        activeContext = {
          projectId: derived.projectId,
          sessionId: derived.runId,
          projectName: legacyOverride?.projectName || derived.projectName,
          sessionLabel: derived.runLabel,
          draft: true
        };
      }
      changed = true;
    }
  }

  if (changed) await setProjects(projects);
  if (changed || !activeContext || legacyOverride) await setActiveContext(activeContext);
  if (legacyOverride) await chrome.storage.local.remove(TARGET_OVERRIDE_KEY);

  const workspace = { projects, activeContext };
  return {
    ...workspace,
    target: targetForWorkspace(pageUrl, workspace),
    suggestedSessionLabel: derived.runLabel
  };
}

async function currentPageUrl() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return /^https?:/u.test(tab?.url || "") ? tab.url : "";
}

function notesForTarget(notes, target) {
  return notes.filter((note) => note.projectId === target.projectId && note.runId === target.runId);
}

async function dashboard() {
  const pageUrl = await currentPageUrl();
  const workspace = await ensureWorkspace(pageUrl);
  const allNotes = await listNotes();
  const notes = notesForTarget(allNotes, workspace.target);
  const projectNoteCount = allNotes.filter((note) => note.projectId === workspace.target.projectId).length;
  return { ...workspace, notes, sessionNoteCount: notes.length, projectNoteCount, totalNoteCount: allNotes.length };
}

async function exportNotes() {
  const pageUrl = await currentPageUrl();
  const workspace = await ensureWorkspace(pageUrl);
  const notes = notesForTarget(await listNotes(), workspace.target);
  return createQaExport(notes, workspace.target);
}

async function setProjectName(projectName) {
  const name = projectName?.trim();
  if (!name) throw new Error("Add a project name before saving.");
  return createProjectRecord(name);
}

async function createProjectRecord(name) {
  const pageUrl = await currentPageUrl();
  const workspace = await ensureWorkspace(pageUrl);
  const project = createProject({ name });
  const derived = deriveTarget(pageUrl);
  const session = createSession({ projectId: project.id, label: derived.runLabel });
  await setActiveContext({
    projectId: project.id,
    sessionId: session.id,
    projectName: project.name,
    sessionLabel: session.label,
    draft: true,
    draftSession: true
  });
  return dashboard();
}

async function selectProject(projectId) {
  const pageUrl = await currentPageUrl();
  const workspace = await ensureWorkspace(pageUrl);
  const project = workspace.projects.find((candidate) => candidate.id === projectId);
  if (!project) throw new Error("That project is no longer available.");
  if (!project.sessions.length) {
    const derived = deriveTarget(pageUrl);
    await setActiveContext({
      projectId: project.id,
      sessionId: derived.runId,
      projectName: project.name,
      sessionLabel: derived.runLabel,
      draftSession: true
    });
    return dashboard();
  }
  const session = latestSession(project);
  await setActiveContext({ projectId: project.id, sessionId: session.id });
  return dashboard();
}

async function createSessionRecord(label) {
  const pageUrl = await currentPageUrl();
  const workspace = await ensureWorkspace(pageUrl);
  const project = workspace.projects.find((candidate) => candidate.id === workspace.activeContext.projectId);
  const derived = deriveTarget(pageUrl);
  const session = createSession({
    projectId: project?.id || workspace.activeContext.projectId,
    label: label?.trim() || derived.runLabel
  });
  if (project) {
    await setActiveContext({
      projectId: project.id,
      sessionId: session.id,
      sessionLabel: session.label,
      draftSession: true
    });
  } else {
    await setActiveContext({
      ...workspace.activeContext,
      sessionId: session.id,
      sessionLabel: session.label,
      draft: true,
      draftSession: true
    });
  }
  return dashboard();
}

async function selectSession(sessionId) {
  const pageUrl = await currentPageUrl();
  const workspace = await ensureWorkspace(pageUrl);
  const project = workspace.projects.find((candidate) => candidate.id === workspace.activeContext.projectId);
  const session = project?.sessions.find((candidate) => candidate.id === sessionId);
  if (!session) throw new Error("That session is no longer available.");
  await setActiveContext({ projectId: project.id, sessionId: session.id });
  return dashboard();
}

async function moveNoteRecord(noteId, destinationProjectId, destinationSessionId, newProjectName) {
  const note = await getNote(noteId);
  if (!note) throw new Error("That note is no longer available.");

  const pageUrl = await currentPageUrl();
  const workspace = await ensureWorkspace(pageUrl);
  let projects = workspace.projects;
  let destinationProject;
  let destinationSession;

  if (newProjectName?.trim()) {
    destinationProject = createProject({ name: newProjectName });
    destinationSession = createSession({
      projectId: destinationProject.id,
      label: deriveTarget(pageUrl).runLabel
    });
    destinationProject.sessions = [destinationSession];
    destinationProject.updatedAt = new Date().toISOString();
    projects = [...projects, destinationProject];
    await setProjects(projects);
  } else {
    destinationProject = projects.find((project) => project.id === destinationProjectId);
    destinationSession = destinationProject?.sessions.find((session) => session.id === destinationSessionId) || latestSession(destinationProject);
    if (!destinationProject || !destinationSession) throw new Error("Choose a valid destination project and session.");
  }

  const movedNote = reassignNote(note, {
    projectId: destinationProject.id,
    projectName: destinationProject.name,
    runId: destinationSession.id,
    runLabel: destinationSession.label
  });
  await putNote(movedNote);
  return dashboard();
}

async function deleteNoteRecord(noteId) {
  const note = await getNote(noteId);
  if (!note) return { ok: true };
  await deleteNote(noteId);
  return { ok: true };
}

async function clearActiveSession() {
  const pageUrl = await currentPageUrl();
  const workspace = await ensureWorkspace(pageUrl);
  const removed = await deleteNotesWhere((note) => note.projectId === workspace.target.projectId && note.runId === workspace.target.runId);
  return { ...(await dashboard()), removed };
}

async function deleteActiveSession() {
  const pageUrl = await currentPageUrl();
  const workspace = await ensureWorkspace(pageUrl);
  const notes = await listNotes();
  const project = workspace.projects.find((candidate) => candidate.id === workspace.target.projectId);
  const session = project?.sessions.find((candidate) => candidate.id === workspace.target.runId);
  if (!project || !session) throw new Error("That QA session is not saved yet.");
  if (notesForTarget(notes, workspace.target).length) throw new Error("Clear this QA session before deleting it.");

  const projects = removeSessionIfEmpty(workspace.projects, notes, project.id, session.id);
  await setProjects(projects);
  const updatedProject = projects.find((candidate) => candidate.id === project.id);
  const replacementSession = latestSession(updatedProject);
  if (replacementSession) {
    await setActiveContext({ projectId: project.id, sessionId: replacementSession.id });
  } else {
    const derived = deriveTarget(pageUrl);
    await setActiveContext({
      projectId: project.id,
      sessionId: derived.runId,
      projectName: project.name,
      sessionLabel: derived.runLabel,
      draftSession: true
    });
  }
  return dashboard();
}

async function deleteActiveProject() {
  const pageUrl = await currentPageUrl();
  const workspace = await ensureWorkspace(pageUrl);
  const notes = await listNotes();
  const project = workspace.projects.find((candidate) => candidate.id === workspace.target.projectId);
  if (!project) throw new Error("That project is not saved yet.");
  if (notes.some((note) => note.projectId === project.id)) throw new Error("Clear this project before deleting it.");

  const derived = deriveTarget(pageUrl);
  await setProjects(removeProjectIfEmpty(workspace.projects, notes, project.id));
  await setActiveContext({
    projectId: derived.projectId,
    sessionId: derived.runId,
    projectName: derived.projectName,
    sessionLabel: derived.runLabel,
    draft: true
  });
  return dashboard();
}

async function clearActiveProject() {
  const pageUrl = await currentPageUrl();
  const workspace = await ensureWorkspace(pageUrl);
  const removed = await deleteNotesWhere((note) => note.projectId === workspace.target.projectId);
  return { ...(await dashboard()), removed };
}

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url) throw new Error("Spottr could not access the active tab. Open a regular webpage and try again.");
  if (/^file:/u.test(tab.url)) throw new Error("Spottr does not have access to local files. Open an http or https webpage and try again.");
  if (!/^https?:/u.test(tab.url)) throw new Error("Spottr cannot capture browser settings, extension pages, or other restricted pages. Open a regular http or https webpage and try again.");
  const hostname = new URL(tab.url).hostname;
  if (hostname === "chromewebstore.google.com" || (hostname === "chrome.google.com" && tab.url.includes("/webstore"))) {
    throw new Error("Chrome blocks extensions from running on Chrome Web Store pages. Open another website and try again.");
  }
  return tab;
}

async function ensureContentScript(tabId) {
  try {
    const [installed] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => Boolean(window.__spottrContentScriptInstalled)
    });
    if (installed?.result) return;

    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content.js"]
    });
  } catch {
    throw new Error("Spottr cannot run on this page. Try a regular website where Chrome allows extensions to access page content.");
  }
}

async function beginCapture() {
  const tab = await activeTab();
  await ensureContentScript(tab.id);
  await chrome.tabs.sendMessage(tab.id, { type: "qa-start-selection" });
  return { ok: true };
}

async function beginTextNote() {
  const tab = await activeTab();
  await ensureContentScript(tab.id);
  const workspace = await ensureWorkspace(tab.url);
  await chrome.tabs.sendMessage(tab.id, {
    type: "qa-show-composer",
    target: workspace.target,
    workspace
  });
  return { ok: true };
}

async function captureSelection(tab, capture) {
  if (!tab?.id || tab.windowId == null || !capture?.selection) return;

  let screenshot;
  try {
    screenshot = await chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" });
  } catch {
    throw new Error("Chrome could not capture this viewport. Keep the page active, then try Capture area again.");
  }
  const workspace = await ensureWorkspace(capture.pageUrl);
  await chrome.tabs.sendMessage(tab.id, {
    type: "qa-show-composer",
    screenshot,
    target: workspace.target,
    workspace,
    capture
  });
}

async function saveNote(input, assignment) {
  const pageUrl = String(input?.pageUrl || await currentPageUrl());
  const workspace = await ensureWorkspace(pageUrl);
  const assigned = assignNoteDraft(workspace, assignment, input?.target || workspace.target);
  const note = createNote({ ...input, pageUrl, target: assigned.target });
  if (!note.message) throw new Error("Add a short note before saving.");
  await putNote(note);
  await Promise.all([
    setProjects(assigned.projects),
    setActiveContext(assigned.activeContext)
  ]);
  return note;
}

async function shortcuts() {
  const commands = await chrome.commands.getAll();
  return {
    capture: commands.find((command) => command.name === "capture-qa-note")?.shortcut || "Not set",
    note: commands.find((command) => command.name === "add-qa-note")?.shortcut || "Not set"
  };
}

async function handleMessage(message, sender) {
  switch (message?.type) {
    case "qa-start-capture":
      return beginCapture();
    case "qa-start-note":
      return beginTextNote();
    case "qa-selection-complete":
      return captureSelection(sender.tab, message.capture);
    case "qa-save-note":
      return saveNote(message.note, message.assignment);
    case "qa-get-dashboard":
      return dashboard();
    case "qa-set-project":
      return setProjectName(message.projectName);
    case "qa-create-project":
      return createProjectRecord(message.name);
    case "qa-select-project":
      return selectProject(message.projectId);
    case "qa-create-session":
      return createSessionRecord(message.label);
    case "qa-select-session":
      return selectSession(message.sessionId);
    case "qa-move-note":
      return moveNoteRecord(message.noteId, message.destinationProjectId, message.destinationSessionId, message.newProjectName);
    case "qa-clear-session":
      return clearActiveSession();
    case "qa-clear-project":
      return clearActiveProject();
    case "qa-delete-session":
      return deleteActiveSession();
    case "qa-delete-project":
      return deleteActiveProject();
    case "qa-get-shortcuts":
      return shortcuts();
    case "qa-export":
      return exportNotes();
    case "qa-delete-note":
      return deleteNoteRecord(message.noteId);
    default:
      return undefined;
  }
}

chrome.commands.onCommand.addListener((command) => {
  if (command === "capture-qa-note") {
    void beginCapture().catch((error) => console.warn(error));
  }
  if (command === "add-qa-note") {
    void beginTextNote().catch((error) => console.warn(error));
  }
});

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === "install") {
    void chrome.tabs.create({ url: chrome.runtime.getURL("welcome.html") });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message?.type?.startsWith("qa-")) return false;

  void handleMessage(message, sender)
    .then((result) => sendResponse({ ok: true, result }))
    .catch((error) => sendResponse({
      ok: false,
      error: error instanceof Error ? error.message : "Spottr failed."
    }));

  return true;
});
