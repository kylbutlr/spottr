const EPHEMERAL_QUERY_KEYS = new Set([
  "access_token",
  "auth_token",
  "cache_bust",
  "cachebust",
  "preview_token",
  "previewtoken",
  "token"
]);

export function createId(prefix = "id") {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) return `${prefix}_${uuid}`;

  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
}

export function compact(value) {
  return String(value ?? "").replace(/\s+/gu, " ").trim();
}

export function normalizeUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    for (const key of [...url.searchParams.keys()]) {
      if (EPHEMERAL_QUERY_KEYS.has(key.toLowerCase())) {
        url.searchParams.delete(key);
      }
    }
    url.hash = "";
    return url.toString();
  } catch {
    return String(rawUrl ?? "");
  }
}

export function targetLabel(target) {
  const project = compact(target?.projectName) || "Unassigned project";
  const environment = compact(target?.environment) || "Unspecified environment";
  const run = compact(target?.runLabel);
  return run ? `${project} / ${environment} / ${run}` : `${project} / ${environment}`;
}

export function createTarget(input = {}) {
  return {
    projectId: compact(input.projectId) || createId("project"),
    projectName: compact(input.projectName) || "Unassigned project",
    environment: compact(input.environment) || "Unspecified environment",
    runId: compact(input.runId) || createId("run"),
    runLabel: compact(input.runLabel) || "Ad hoc QA run"
  };
}

export function createSession(input = {}) {
  const createdAt = input.createdAt || new Date().toISOString();
  return {
    id: compact(input.id) || createId("session"),
    projectId: compact(input.projectId),
    label: compact(input.label) || "QA session",
    createdAt
  };
}

export function createProject(input = {}) {
  const createdAt = input.createdAt || new Date().toISOString();
  const id = compact(input.id) || createId("project");
  return {
    id,
    name: compact(input.name) || "Untitled project",
    sessions: Array.isArray(input.sessions) ? input.sessions.map((session) => createSession({ ...session, projectId: session.projectId || id })) : [],
    createdAt,
    updatedAt: input.updatedAt || createdAt
  };
}

function localDate(value = new Date()) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function siteKey(url) {
  const host = url.hostname.toLowerCase();
  const port = url.port ? `_${url.port}` : "";
  return `${host}${port}`.replace(/[^a-z0-9]+/gu, "_").replace(/^_+|_+$/gu, "") || "page";
}

export function deriveTarget(pageUrl, now = new Date()) {
  try {
    const url = new URL(pageUrl);
    const key = siteKey(url);
    const host = url.hostname.toLowerCase();
    const environment = ["localhost", "127.0.0.1", "::1"].includes(host)
      ? "Local"
      : host.endsWith(".netlify.app")
        ? "Netlify preview"
        : host.endsWith(".vercel.app")
          ? "Vercel preview"
          : "Web preview";
    const date = localDate(now);
    return createTarget({
      projectId: `project_${key}`,
      projectName: host,
      environment,
      runId: `run_${key}_${date}`,
      runLabel: `QA ${date}`
    });
  } catch {
    return createTarget();
  }
}

export function createNote(input = {}) {
  const target = createTarget(input.target);
  const pageUrl = String(input.pageUrl ?? "");

  return {
    id: compact(input.id) || createId("note"),
    projectId: target.projectId,
    projectName: target.projectName,
    environment: target.environment,
    runId: target.runId,
    runLabel: target.runLabel,
    message: compact(input.message),
    url: pageUrl,
    normalizedUrl: normalizeUrl(pageUrl),
    pageTitle: compact(input.pageTitle),
    viewport: input.viewport ?? null,
    scroll: input.scroll ?? null,
    selection: input.selection ?? null,
    screenshot: input.screenshot ?? null,
    createdAt: input.createdAt || new Date().toISOString()
  };
}

export function reassignNote(note, target) {
  return {
    ...note,
    projectId: target.projectId,
    projectName: target.projectName,
    runId: target.runId,
    runLabel: target.runLabel
  };
}

export function createQaExport(notes, target) {
  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    target: createTarget(target),
    notes: [...notes].sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)))
  };
}
