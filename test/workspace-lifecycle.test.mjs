import assert from "node:assert/strict";
import test from "node:test";
import { createNote, createProject, createSession, createTarget } from "../shared/model.js";
import { reconcileWorkspaceProjects, removeProjectIfEmpty, removeSessionIfEmpty } from "../shared/workspace.js";

function workspaceFixture() {
  const session = createSession({ id: "session_1", projectId: "project_1", label: "9/5" });
  const project = createProject({ id: "project_1", name: "Demo app", sessions: [session] });
  const note = createNote({
    id: "note_1",
    target: createTarget({
      projectId: project.id,
      projectName: project.name,
      runId: session.id,
      runLabel: session.label
    }),
    message: "Test note"
  });
  return { note, project, session };
}

test("clearing the only session keeps its stored project and session", () => {
  const { note, project, session } = workspaceFixture();
  const beforeClear = reconcileWorkspaceProjects([project], [note]);
  const afterClear = reconcileWorkspaceProjects(beforeClear.projects, []);

  assert.equal(afterClear.projects.length, 1);
  assert.equal(afterClear.projects[0].id, project.id);
  assert.equal(afterClear.projects[0].sessions.length, 1);
  assert.equal(afterClear.projects[0].sessions[0].id, session.id);
});

test("explicit cleanup can still remove a project after its last note is deleted", () => {
  const { project } = workspaceFixture();
  const projects = removeProjectIfEmpty([project], [], project.id);

  assert.deepEqual(projects, []);
});

test("explicit cleanup can remove an empty session without removing its project", () => {
  const { project, session } = workspaceFixture();
  const projects = removeSessionIfEmpty([project], [], project.id, session.id);

  assert.equal(projects.length, 1);
  assert.equal(projects[0].id, project.id);
  assert.deepEqual(projects[0].sessions, []);
});

test("an empty-session cleanup leaves a session that still owns notes intact", () => {
  const { note, project, session } = workspaceFixture();
  const projects = removeSessionIfEmpty([project], [note], project.id, session.id);

  assert.equal(projects[0].sessions[0].id, session.id);
});
