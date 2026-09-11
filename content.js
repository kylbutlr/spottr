const ROOT_ID = "spottr-root";
let fontsPromise;

function loadAppStylrFonts() {
  fontsPromise ||= Promise.all([
    ["Geist Sans", "Geist-Variable.woff2"],
    ["Geist Mono", "GeistMono-Variable.woff2"]
  ].map(async ([family, file]) => {
    const fontUrl = chrome.runtime.getURL(`fonts/${file}`);
    const fontFace = new FontFace(family, `url("${fontUrl}")`, { weight: "100 900" });
    document.fonts.add(fontFace);
    await fontFace.load().catch(() => undefined);
  }));
  return fontsPromise;
}

function removeRoot() {
  document.getElementById(ROOT_ID)?.remove();
}

function createRoot(className) {
  removeRoot();
  const host = document.createElement("div");
  host.id = ROOT_ID;
  host.className = className;
  host.style.setProperty("all", "initial");
  host.style.setProperty("z-index", "2147483647");
  host.style.setProperty("--ui-canvas", "#0D1010");
  host.style.setProperty("--ui-surface", "#171B1B");
  host.style.setProperty("--ui-surface-raised", "#1D2222");
  host.style.setProperty("--ui-border", "#303838");
  host.style.setProperty("--ui-border-strong", "#465351");
  host.style.setProperty("--ui-text", "#F3F7F5");
  host.style.setProperty("--ui-text-muted", "#A9B5B2");
  host.style.setProperty("--ui-accent", "#A9CEC2");
  host.style.setProperty("--ui-accent-text", "#111111");
  host.style.setProperty("--ui-selected", "#263D39");
  host.style.setProperty("--ui-danger", "#FF9189");
  host.style.setProperty("--font-sans", '"Geist Sans", -apple-system, BlinkMacSystemFont, sans-serif');
  host.style.setProperty("--font-mono", '"Geist Mono", ui-monospace, monospace');
  host.style.setProperty("--radius-control", "8px");
  host.style.setProperty("--radius-dialog", "16px");
  document.documentElement.append(host);
  const shadow = host.attachShadow({ mode: "open" });
  const reset = document.createElement("style");
  reset.textContent = `:host { font-family: var(--font-sans); color: var(--ui-text); } * { box-sizing: border-box; } button, input, select, textarea { font: inherit; } button:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible { outline: 3px solid var(--ui-accent); outline-offset: 2px; }`;
  shadow.append(reset);
  return { host, shadow };
}

function style(element, styles) {
  Object.assign(element.style, styles);
  return element;
}

function button(label, kind = "primary") {
  const element = document.createElement("button");
  element.type = "button";
  element.textContent = label;
  style(element, {
    all: "unset",
    boxSizing: "border-box",
    cursor: "pointer",
    borderRadius: "var(--radius-control)",
    padding: "9px 13px",
    background: kind === "primary" ? "var(--ui-accent)" : "var(--ui-surface-raised)",
    color: kind === "primary" ? "var(--ui-accent-text)" : "var(--ui-text-muted)",
    font: "600 13px var(--font-sans)",
    textAlign: "center"
  });
  return element;
}

function waitForPaint() {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

async function sendSelection(capture) {
  try {
    await waitForPaint();
    await waitForPaint();
    const response = await chrome.runtime.sendMessage({ type: "qa-selection-complete", capture });
    if (!response?.ok) showNotice(response?.error || "Spottr could not prepare this capture.");
  } catch {
    showNotice("Spottr could not prepare this capture. Keep the page active and try again.");
  }
}

function showNotice(message) {
  const { host: root, shadow } = createRoot("spottr-notice");
  style(root, {
    position: "fixed",
    inset: "0",
    display: "grid",
    placeItems: "center",
    padding: "16px",
    background: "rgba(20, 38, 34, 0.26)"
  });
  const panel = document.createElement("div");
  panel.setAttribute("role", "alertdialog");
  panel.setAttribute("aria-modal", "true");
  panel.setAttribute("aria-labelledby", "spottr-notice-title");
  style(panel, {
    width: "min(420px, calc(100vw - 32px))",
    padding: "18px",
    border: "1px solid var(--ui-border)",
    borderRadius: "var(--radius-dialog)",
    background: "var(--ui-surface)",
    color: "var(--ui-text)",
    boxShadow: "0 18px 48px rgba(0, 0, 0, 0.32)"
  });
  const title = document.createElement("h2");
  title.id = "spottr-notice-title";
  title.textContent = "Capture unavailable";
  style(title, { margin: "0 0 8px", font: "700 18px var(--font-sans)" });
  const copy = document.createElement("p");
  copy.textContent = message;
  style(copy, { margin: "0 0 16px", color: "var(--ui-text-muted)", font: "400 14px/1.45 var(--font-sans)" });
  const dismiss = button("Got it");
  dismiss.addEventListener("click", removeRoot);
  shadow.addEventListener("keydown", (event) => {
    event.stopPropagation();
    if (event.key === "Escape") {
      event.preventDefault();
      removeRoot();
    }
  });
  panel.append(title, copy, dismiss);
  shadow.append(panel);
  dismiss.focus();
}

function startSelection() {
  const { host: root, shadow } = createRoot("spottr-selection");
  style(root, {
    position: "fixed",
    inset: "0",
    display: "block",
    cursor: "crosshair",
    touchAction: "none",
    userSelect: "none",
    background: "transparent"
  });

  const shadeColor = "rgba(20, 38, 34, 0.32)";
  const shade = document.createElement("div");
  style(shade, {
    position: "fixed",
    inset: "0",
    background: shadeColor,
    pointerEvents: "none"
  });
  shadow.append(shade);

  const shadeParts = ["top", "right", "bottom", "left"].map(() => {
    const part = document.createElement("div");
    style(part, {
      position: "fixed",
      display: "none",
      background: shadeColor,
      pointerEvents: "none"
    });
    shadow.append(part);
    return part;
  });

  const resetMask = () => {
    shade.style.display = "block";
    for (const part of shadeParts) part.style.display = "none";
  };

  const updateMask = (x, y, width, height) => {
    shade.style.display = "none";
    const [top, right, bottom, left] = shadeParts;
    style(top, { display: "block", left: "0", top: "0", width: "100%", height: `${y}px` });
    style(right, { display: "block", left: `${x + width}px`, top: `${y}px`, width: `calc(100% - ${x + width}px)`, height: `${height}px` });
    style(bottom, { display: "block", left: "0", top: `${y + height}px`, width: "100%", height: `calc(100% - ${y + height}px)` });
    style(left, { display: "block", left: "0", top: `${y}px`, width: `${x}px`, height: `${height}px` });
  };

  const help = document.createElement("div");
  help.textContent = "Drag to capture an area • Esc to cancel";
  help.setAttribute("role", "status");
  style(help, {
    position: "fixed",
    top: "18px",
    left: "50%",
    transform: "translateX(-50%)",
    padding: "9px 12px",
    borderRadius: "999px",
    background: "var(--ui-surface)",
    color: "var(--ui-text)",
    font: "600 13px var(--font-sans)",
    pointerEvents: "none",
    whiteSpace: "nowrap"
  });
  shadow.append(help);

  const box = document.createElement("div");
  style(box, {
    position: "fixed",
    display: "none",
    border: "2px solid var(--ui-accent)",
    background: "transparent",
    boxSizing: "border-box",
    pointerEvents: "none"
  });
  shadow.append(box);

  let start;
  const updateBox = (event) => {
    if (!start) return;
    const x = Math.min(start.x, event.clientX);
    const y = Math.min(start.y, event.clientY);
    const width = Math.abs(event.clientX - start.x);
    const height = Math.abs(event.clientY - start.y);
    updateMask(x, y, width, height);
    style(box, {
      display: "block",
      left: `${x}px`,
      top: `${y}px`,
      width: `${width}px`,
      height: `${height}px`
    });
  };

  root.addEventListener("pointerdown", (event) => {
    start = { x: event.clientX, y: event.clientY };
    updateBox(event);
    root.setPointerCapture(event.pointerId);
  });
  root.addEventListener("pointermove", updateBox);
  root.addEventListener("pointerup", (event) => {
    if (!start) return;
    const x = Math.min(start.x, event.clientX);
    const y = Math.min(start.y, event.clientY);
    const width = Math.abs(event.clientX - start.x);
    const height = Math.abs(event.clientY - start.y);
    start = undefined;
    if (width < 8 || height < 8) {
      resetMask();
      box.style.display = "none";
      return;
    }

    const capture = {
      selection: { x, y, width, height },
      pageUrl: window.location.href,
      pageTitle: document.title,
      viewport: { width: window.innerWidth, height: window.innerHeight, devicePixelRatio: window.devicePixelRatio },
      scroll: { x: window.scrollX, y: window.scrollY }
    };
    closeSelection();
    void sendSelection(capture);
  });
  root.addEventListener("pointercancel", closeSelection);
  const handleSelectionKeydown = (event) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    event.stopPropagation();
    closeSelection();
  };
  function closeSelection() {
    document.removeEventListener("keydown", handleSelectionKeydown, { capture: true });
    removeRoot();
  }
  document.addEventListener("keydown", handleSelectionKeydown, { capture: true });
}

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not prepare the captured screenshot."));
    image.src = dataUrl;
  });
}

async function cropScreenshot(dataUrl, selection) {
  const image = await loadImage(dataUrl);
  const scaleX = image.width / window.innerWidth;
  const scaleY = image.height / window.innerHeight;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(selection.width * scaleX));
  canvas.height = Math.max(1, Math.round(selection.height * scaleY));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Chrome could not prepare the captured screenshot.");
  context.drawImage(
    image,
    Math.round(selection.x * scaleX),
    Math.round(selection.y * scaleY),
    canvas.width,
    canvas.height,
    0,
    0,
    canvas.width,
    canvas.height
  );
  return canvas.toDataURL("image/webp", 0.86);
}

async function showComposer(message) {
  await loadAppStylrFonts();
  const capture = message.capture || {
    pageUrl: window.location.href,
    pageTitle: document.title,
    viewport: { width: window.innerWidth, height: window.innerHeight, devicePixelRatio: window.devicePixelRatio },
    scroll: { x: window.scrollX, y: window.scrollY },
    selection: null
  };
  const hasScreenshot = Boolean(message.screenshot && capture.selection);
  const { host: root, shadow } = createRoot("spottr-composer");
  style(root, {
    position: "fixed",
    inset: "0",
    display: "grid",
    placeItems: "center",
    background: "rgba(20, 38, 34, 0.26)"
  });

  const panel = document.createElement("div");
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  panel.setAttribute("aria-labelledby", "spottr-composer-title");
  style(panel, {
    width: "min(430px, calc(100vw - 32px))",
    maxHeight: "calc(100vh - 32px)",
    overflowY: "auto",
    boxSizing: "border-box",
    padding: "18px",
    borderRadius: "var(--radius-dialog)",
    background: "var(--ui-surface)",
    color: "var(--ui-text)",
    border: "1px solid var(--ui-border)",
    boxShadow: "0 18px 48px rgba(0, 0, 0, 0.32)"
  });
  shadow.append(panel);

  const heading = document.createElement("h2");
  heading.id = "spottr-composer-title";
  heading.textContent = "Add QA note";
  style(heading, { font: "700 18px var(--font-sans)", margin: "0 0 6px" });
  panel.append(heading);

  const NEW_PROJECT_VALUE = "__new_project__";
  const NEW_SESSION_VALUE = "__new_session__";
  const suggestedSessionLabel = message.workspace?.suggestedSessionLabel || message.target.runLabel;
  const workspaceProjects = (message.workspace?.projects || []).map((project) => ({
    ...project,
    sessions: [...(project.sessions || [])]
  }));
  let targetProject = workspaceProjects.find((project) => project.id === message.target.projectId);
  if (!targetProject) {
    targetProject = {
      id: message.target.projectId,
      name: message.target.projectName,
      sessions: [],
      draft: true
    };
    workspaceProjects.push(targetProject);
  }
  if (!targetProject.sessions.some((session) => session.id === message.target.runId)) {
    targetProject.sessions.push({
      id: message.target.runId,
      projectId: targetProject.id,
      label: message.target.runLabel,
      draft: true
    });
  }

  const target = document.createElement("div");
  style(target, { color: "var(--ui-text-muted)", font: "500 11px/16px var(--font-mono)", marginBottom: "12px" });
  panel.append(target);

  const assignmentFields = document.createElement("div");
  style(assignmentFields, { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "8px", marginBottom: "10px" });
  panel.append(assignmentFields);

  const controlStyle = {
    all: "initial",
    boxSizing: "border-box",
    display: "block",
    width: "100%",
    minWidth: "0",
    minHeight: "38px",
    padding: "8px 9px",
    border: "1px solid var(--ui-border)",
    borderRadius: "var(--radius-control)",
    background: "var(--ui-surface-raised)",
    color: "var(--ui-text)",
    colorScheme: "dark",
    font: "500 13px var(--font-sans)"
  };

  function createField(labelText, control) {
    const field = document.createElement("label");
    style(field, { display: "grid", gap: "4px", minWidth: "0" });
    const label = document.createElement("span");
    label.textContent = labelText;
    style(label, { color: "var(--ui-text-muted)", font: "600 10px/14px var(--font-mono)", letterSpacing: ".08em" });
    field.append(label, control);
    return field;
  }

  const projectSelect = document.createElement("select");
  projectSelect.setAttribute("aria-label", "Project");
  style(projectSelect, controlStyle);
  for (const project of [...workspaceProjects].sort((a, b) => {
    if (a.id === b.id) return 0;
    if (a.id === message.target.projectId) return -1;
    if (b.id === message.target.projectId) return 1;
    return a.name.localeCompare(b.name);
  })) {
    const option = document.createElement("option");
    option.value = project.id;
    option.textContent = project.draft ? `${project.name} (in progress)` : project.name;
    projectSelect.append(option);
  }
  const createProjectOption = document.createElement("option");
  createProjectOption.value = NEW_PROJECT_VALUE;
  createProjectOption.textContent = "Create new project...";
  projectSelect.append(createProjectOption);
  projectSelect.value = message.target.projectId;
  assignmentFields.append(createField("PROJECT", projectSelect));

  const sessionSelect = document.createElement("select");
  sessionSelect.setAttribute("aria-label", "QA session");
  style(sessionSelect, controlStyle);
  assignmentFields.append(createField("QA SESSION", sessionSelect));

  const newProjectInput = document.createElement("input");
  newProjectInput.type = "text";
  newProjectInput.autocomplete = "off";
  newProjectInput.placeholder = "Project name";
  newProjectInput.setAttribute("aria-label", "New project name");
  style(newProjectInput, controlStyle);
  const newProjectField = createField("NEW PROJECT", newProjectInput);
  style(newProjectField, { display: "none", marginBottom: "10px" });
  panel.append(newProjectField);

  const newSessionInput = document.createElement("input");
  newSessionInput.type = "text";
  newSessionInput.autocomplete = "off";
  newSessionInput.placeholder = "Session label (optional)";
  newSessionInput.setAttribute("aria-label", "New QA session label");
  style(newSessionInput, controlStyle);
  const newSessionField = createField("NEW QA SESSION", newSessionInput);
  style(newSessionField, { display: "none", marginBottom: "10px" });
  panel.append(newSessionField);

  function selectedProject() {
    return workspaceProjects.find((project) => project.id === projectSelect.value);
  }

  function updateTargetSummary() {
    const creatingProject = projectSelect.value === NEW_PROJECT_VALUE;
    const creatingSession = creatingProject || sessionSelect.value === NEW_SESSION_VALUE;
    const projectName = creatingProject
      ? newProjectInput.value.trim() || "New project"
      : selectedProject()?.name || message.target.projectName;
    const selectedSession = selectedProject()?.sessions.find((session) => session.id === sessionSelect.value);
    const sessionLabel = creatingSession
      ? newSessionInput.value.trim() || suggestedSessionLabel
      : selectedSession?.label || message.target.runLabel;
    target.textContent = `${projectName} / ${message.target.environment} / ${sessionLabel}`;
  }

  function renderSessions(preferredSessionId) {
    const creatingProject = projectSelect.value === NEW_PROJECT_VALUE;
    const project = selectedProject();
    sessionSelect.replaceChildren();

    if (!creatingProject) {
      for (const session of [...(project?.sessions || [])].sort((a, b) => {
        if (a.id === b.id) return 0;
        if (a.id === preferredSessionId) return -1;
        if (b.id === preferredSessionId) return 1;
        return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
      })) {
        const option = document.createElement("option");
        option.value = session.id;
        option.textContent = session.draft ? `${session.label} (in progress)` : session.label;
        sessionSelect.append(option);
      }
    }

    const createSessionOption = document.createElement("option");
    createSessionOption.value = NEW_SESSION_VALUE;
    createSessionOption.textContent = "Create new session...";
    sessionSelect.append(createSessionOption);
    sessionSelect.disabled = creatingProject;
    sessionSelect.value = creatingProject
      ? NEW_SESSION_VALUE
      : project?.sessions.some((session) => session.id === preferredSessionId)
        ? preferredSessionId
        : sessionSelect.options[0]?.value || NEW_SESSION_VALUE;

    newProjectField.style.display = creatingProject ? "grid" : "none";
    const creatingSession = creatingProject || sessionSelect.value === NEW_SESSION_VALUE;
    newSessionField.style.display = creatingSession ? "grid" : "none";
    updateTargetSummary();
  }

  projectSelect.addEventListener("change", () => {
    renderSessions();
    if (projectSelect.value === NEW_PROJECT_VALUE) newProjectInput.focus();
  });
  sessionSelect.addEventListener("change", () => {
    newSessionField.style.display = sessionSelect.value === NEW_SESSION_VALUE ? "grid" : "none";
    updateTargetSummary();
    if (sessionSelect.value === NEW_SESSION_VALUE) newSessionInput.focus();
  });
  newProjectInput.addEventListener("input", updateTargetSummary);
  newSessionInput.addEventListener("input", updateTargetSummary);
  renderSessions(message.target.runId);

  let preview;
  if (hasScreenshot) {
    preview = document.createElement("img");
    preview.alt = "Selected QA evidence";
    style(preview, { display: "block", width: "100%", maxHeight: "220px", objectFit: "contain", borderRadius: "var(--radius-control)", background: "var(--ui-surface-raised)", marginBottom: "14px" });
    panel.append(preview);
  }

  const textarea = document.createElement("textarea");
  textarea.placeholder = "What needs attention?";
  textarea.setAttribute("aria-describedby", "spottr-composer-error");
  textarea.rows = 4;
  style(textarea, { all: "initial", boxSizing: "border-box", display: "block", width: "100%", padding: "11px", border: "1px solid var(--ui-border)", borderRadius: "var(--radius-control)", resize: "vertical", background: "var(--ui-surface-raised)", color: "var(--ui-text)", font: "14px/1.4 var(--font-sans)" });
  panel.append(textarea);

  const error = document.createElement("div");
  error.id = "spottr-composer-error";
  error.setAttribute("role", "alert");
  error.setAttribute("aria-live", "polite");
  style(error, { minHeight: "18px", color: "var(--ui-danger)", font: "500 12px var(--font-sans)", marginTop: "6px" });
  panel.append(error);

  const actions = document.createElement("div");
  style(actions, { display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "10px" });
  const cancel = button("Cancel", "secondary");
  const save = button("Save note");
  actions.append(cancel, save);
  panel.append(actions);

  cancel.addEventListener("click", () => removeRoot());
  const focusables = () => [projectSelect, sessionSelect, newProjectInput, newSessionInput, textarea, cancel, save]
    .filter((element) => !element.disabled && element.offsetParent !== null);
  const stopKeyboardPropagation = (event) => event.stopPropagation();
  shadow.addEventListener("keydown", (event) => {
    stopKeyboardPropagation(event);
    if (event.key === "Escape") {
      event.preventDefault();
      removeRoot();
      return;
    }
    if (event.key !== "Tab") return;

    const availableFocusables = focusables();
    const currentIndex = availableFocusables.indexOf(shadow.activeElement);
    const direction = event.shiftKey ? -1 : 1;
    const nextIndex = currentIndex === -1
      ? 0
      : (currentIndex + direction + availableFocusables.length) % availableFocusables.length;
    event.preventDefault();
    availableFocusables[nextIndex].focus();
  });
  shadow.addEventListener("keypress", stopKeyboardPropagation);
  shadow.addEventListener("keyup", stopKeyboardPropagation);

  try {
    const cropped = hasScreenshot
      ? await cropScreenshot(message.screenshot, capture.selection)
      : null;
    if (preview) preview.src = cropped;
    let saving = false;
    const submit = async () => {
      if (saving) return;
      if (!textarea.value.trim()) {
        error.textContent = "Add a short note before saving.";
        textarea.focus();
        return;
      }
      const createProject = projectSelect.value === NEW_PROJECT_VALUE;
      const createSession = createProject || sessionSelect.value === NEW_SESSION_VALUE;
      if (createProject && !newProjectInput.value.trim()) {
        error.textContent = "Add a project name before saving the note.";
        newProjectInput.focus();
        return;
      }
      saving = true;
      save.disabled = true;
      save.textContent = "Saving…";
      const response = await chrome.runtime.sendMessage({
        type: "qa-save-note",
        assignment: {
          createProject,
          createSession,
          projectId: createProject ? undefined : projectSelect.value,
          sessionId: createSession ? undefined : sessionSelect.value,
          newProjectName: createProject ? newProjectInput.value : undefined,
          newSessionLabel: createSession ? newSessionInput.value : undefined
        },
        note: {
          target: message.target,
          message: textarea.value,
          pageUrl: capture.pageUrl,
          pageTitle: capture.pageTitle,
          viewport: capture.viewport,
          scroll: capture.scroll,
          selection: capture.selection,
          screenshot: cropped ? { mimeType: "image/webp", data: cropped } : null
        }
      });
      if (!response?.ok) {
        error.textContent = response?.error || "Could not save the note.";
        saving = false;
        save.disabled = false;
        save.textContent = "Save note";
        return;
      }
      removeRoot();
    };
    save.addEventListener("click", () => void submit());
    textarea.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" || event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) return;
      event.preventDefault();
      void submit();
    });
  } catch (errorValue) {
    error.textContent = errorValue instanceof Error ? errorValue.message : "Could not prepare the screenshot.";
    save.disabled = true;
  }
  textarea.focus();
}

if (!window.__spottrContentScriptInstalled) {
  window.__spottrContentScriptInstalled = true;
  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === "qa-start-selection") startSelection();
    if (message?.type === "qa-show-composer") void showComposer(message);
  });
}
