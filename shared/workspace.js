import { compact, createProject, createSession, createTarget } from "./model.js";

function sessionFromNote(note) {
  return createSession({
    id: note.runId,
    projectId: note.projectId,
    label: note.runLabel,
    createdAt: note.createdAt
  });
}

export function reconcileWorkspaceProjects(projects, notes, legacyOverride) {
  const byId = new Map(projects.map((project) => [project.id, project]));
  let changed = false;

  for (const note of notes) {
    if (!note.projectId) continue;

    let project = byId.get(note.projectId);
    if (!project) {
      project = createProject({
        id: note.projectId,
        name: note.projectName,
        createdAt: note.createdAt,
        updatedAt: note.createdAt,
        sessions: []
      });
      byId.set(project.id, project);
      changed = true;
    }

    if (legacyOverride?.projectId === project.id && legacyOverride.projectName && project.name !== legacyOverride.projectName) {
      project.name = legacyOverride.projectName;
      changed = true;
    }

    if (note.runId && !project.sessions.some((session) => session.id === note.runId)) {
      project.sessions.push(sessionFromNote(note));
      project.updatedAt = note.createdAt || project.updatedAt;
      changed = true;
    }
  }

  return { projects: [...byId.values()], changed };
}

export function removeProjectIfEmpty(projects, notes, projectId) {
  if (notes.some((note) => note.projectId === projectId)) return projects;
  return projects.filter((project) => project.id !== projectId);
}

export function removeSessionIfEmpty(projects, notes, projectId, sessionId) {
  if (notes.some((note) => note.projectId === projectId && note.runId === sessionId)) return projects;
  return projects.map((project) => project.id === projectId
    ? { ...project, sessions: project.sessions.filter((session) => session.id !== sessionId) }
    : project);
}

export function assignNoteDraft(workspace, assignment = {}, pageTarget = workspace.target) {
  const baseTarget = createTarget(pageTarget);
  const projects = workspace.projects.map((project) => ({
    ...project,
    sessions: [...project.sessions]
  }));
  let project;

  if (assignment.createProject) {
    const projectName = compact(assignment.newProjectName);
    if (!projectName) throw new Error("Add a project name before saving the note.");
    project = createProject({ name: projectName });
    projects.push(project);
  } else {
    const projectId = compact(assignment.projectId) || baseTarget.projectId;
    project = projects.find((candidate) => candidate.id === projectId);
    if (!project && projectId === baseTarget.projectId) {
      project = createProject({
        id: projectId,
        name: workspace.activeContext?.projectName || baseTarget.projectName,
        sessions: []
      });
      projects.push(project);
    }
    if (!project) throw new Error("Choose a valid project for this note.");
  }

  let session;
  if (assignment.createProject || assignment.createSession) {
    session = createSession({
      projectId: project.id,
      label: compact(assignment.newSessionLabel) || workspace.suggestedSessionLabel || baseTarget.runLabel
    });
    project.sessions.push(session);
    project.updatedAt = session.createdAt;
  } else {
    const sessionId = compact(assignment.sessionId) || baseTarget.runId;
    session = project.sessions.find((candidate) => candidate.id === sessionId);
    if (!session && project.id === baseTarget.projectId && sessionId === baseTarget.runId) {
      session = createSession({
        id: sessionId,
        projectId: project.id,
        label: workspace.activeContext?.sessionLabel || baseTarget.runLabel
      });
      project.sessions.push(session);
      project.updatedAt = session.createdAt;
    }
    if (!session) throw new Error("Choose a valid QA session for this note.");
  }

  return {
    projects,
    activeContext: { projectId: project.id, sessionId: session.id },
    target: createTarget({
      projectId: project.id,
      projectName: project.name,
      environment: baseTarget.environment,
      runId: session.id,
      runLabel: session.label
    })
  };
}
