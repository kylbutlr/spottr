import assert from "node:assert/strict";
import test from "node:test";
import { createProject, createSession, createTarget } from "../shared/model.js";
import { assignNoteDraft } from "../shared/workspace.js";

function assignmentFixture() {
  const firstSession = createSession({ id: "session_home", projectId: "project_store", label: "Homepage" });
  const secondSession = createSession({ id: "session_cart", projectId: "project_store", label: "Cart" });
  const project = createProject({ id: "project_store", name: "Storefront", sessions: [firstSession, secondSession] });
  return {
    projects: [project],
    activeContext: { projectId: project.id, sessionId: firstSession.id },
    target: createTarget({
      projectId: project.id,
      projectName: project.name,
      environment: "Netlify preview",
      runId: firstSession.id,
      runLabel: firstSession.label
    })
  };
}

test("a note draft can switch to another saved session without losing its page context", () => {
  const workspace = assignmentFixture();
  const assigned = assignNoteDraft(workspace, {
    projectId: "project_store",
    sessionId: "session_cart"
  }, workspace.target);

  assert.equal(assigned.target.projectName, "Storefront");
  assert.equal(assigned.target.runLabel, "Cart");
  assert.equal(assigned.target.environment, "Netlify preview");
  assert.deepEqual(assigned.activeContext, { projectId: "project_store", sessionId: "session_cart" });
});

test("a note draft can create a session inside an existing project", () => {
  const workspace = assignmentFixture();
  const assigned = assignNoteDraft(workspace, {
    projectId: "project_store",
    createSession: true,
    newSessionLabel: "Mobile retest"
  }, workspace.target);

  assert.equal(assigned.target.projectName, "Storefront");
  assert.equal(assigned.target.runLabel, "Mobile retest");
  assert.equal(assigned.projects[0].sessions.length, 3);
});

test("a new session uses the page-based suggestion instead of duplicating the active label", () => {
  const workspace = {
    ...assignmentFixture(),
    suggestedSessionLabel: "QA 2026-09-05"
  };
  const assigned = assignNoteDraft(workspace, {
    projectId: "project_store",
    createSession: true
  }, workspace.target);

  assert.equal(assigned.target.runLabel, "QA 2026-09-05");
});

test("a note draft can create a new project and session", () => {
  const workspace = assignmentFixture();
  const assigned = assignNoteDraft(workspace, {
    createProject: true,
    createSession: true,
    newProjectName: "Checkout",
    newSessionLabel: "Payment QA"
  }, workspace.target);

  assert.equal(assigned.target.projectName, "Checkout");
  assert.equal(assigned.target.runLabel, "Payment QA");
  assert.equal(assigned.projects.length, 2);
});

test("saving to the current draft promotes its project and session", () => {
  const target = createTarget({
    projectId: "project_draft",
    projectName: "Demo app",
    environment: "Netlify preview",
    runId: "session_draft",
    runLabel: "9/5"
  });
  const workspace = {
    projects: [],
    activeContext: {
      projectId: target.projectId,
      sessionId: target.runId,
      projectName: target.projectName,
      sessionLabel: target.runLabel,
      draft: true,
      draftSession: true
    },
    target
  };
  const assigned = assignNoteDraft(workspace, {
    projectId: target.projectId,
    sessionId: target.runId
  }, target);

  assert.equal(assigned.projects[0].name, "Demo app");
  assert.equal(assigned.projects[0].sessions[0].label, "9/5");
  assert.deepEqual(assigned.activeContext, { projectId: target.projectId, sessionId: target.runId });
});
