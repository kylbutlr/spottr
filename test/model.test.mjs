import assert from "node:assert/strict";
import test from "node:test";
import { createNote, createProject, createQaExport, createSession, createTarget, deriveTarget, normalizeUrl, reassignNote, targetLabel } from "../shared/model.js";

test("normalizes ephemeral preview parameters without discarding the raw URL", () => {
  const raw = "https://preview.example.test/pdp?preview_token=random-value&color=blue#details";
  assert.equal(normalizeUrl(raw), "https://preview.example.test/pdp?color=blue");
});

test("creates a stable target shape for an explicit project and run", () => {
  const target = createTarget({ projectName: "Frontend app", environment: "Web preview", runLabel: "Mobile review" });
  assert.equal(target.projectName, "Frontend app");
  assert.equal(target.environment, "Web preview");
  assert.equal(target.runLabel, "Mobile review");
  assert.match(target.projectId, /^project_/u);
  assert.match(target.runId, /^run_/u);
  assert.equal(targetLabel(target), "Frontend app / Web preview / Mobile review");
});

test("models projects with durable sessions", () => {
  const session = createSession({ id: "session_1", projectId: "project_1", label: "Homepage QA" });
  const project = createProject({ id: "project_1", name: "Storefront", sessions: [session] });
  assert.equal(project.name, "Storefront");
  assert.equal(project.sessions[0].id, "session_1");
  assert.equal(project.sessions[0].projectId, "project_1");
  assert.equal(project.sessions[0].label, "Homepage QA");
});

test("derives the same project identity across preview-token URLs", () => {
  const first = deriveTarget("https://random-preview.netlify.app/products/shirt?preview_token=one", new Date(2026, 8, 3));
  const second = deriveTarget("https://random-preview.netlify.app/products/shirt?preview_token=two", new Date(2026, 8, 3));
  assert.equal(first.projectId, second.projectId);
  assert.equal(first.projectName, "random-preview.netlify.app");
  assert.equal(first.environment, "Netlify preview");
  assert.equal(first.runLabel, "QA 2026-09-03");
});

test("creates a QA export ordered by capture time", () => {
  const target = createTarget({ projectName: "Storefront", environment: "Local", runLabel: "mobile QA" });
  const later = createNote({ target, message: "Later", pageUrl: "http://localhost:3000/b", createdAt: "2026-09-03T02:00:00.000Z" });
  const earlier = createNote({ target, message: "Earlier", pageUrl: "http://localhost:3000/a", createdAt: "2026-09-03T01:00:00.000Z" });
  const exported = createQaExport([later, earlier], target);
  assert.deepEqual(exported.notes.map((note) => note.message), ["Earlier", "Later"]);
  assert.equal(exported.target.projectName, "Storefront");
  assert.equal(exported.schemaVersion, 1);
});

test("reassigns a note without changing its capture evidence", () => {
  const note = createNote({
    id: "note_1",
    target: createTarget({ projectId: "project_old", projectName: "Old project", runId: "session_old", runLabel: "Old session" }),
    message: "Check this spacing",
    pageUrl: "https://example.test/page",
    screenshot: { data: "data:image/webp;base64,abc" },
    selection: { x: 10, y: 20, width: 30, height: 40 }
  });
  const moved = reassignNote(note, { projectId: "project_new", projectName: "New project", runId: "session_new", runLabel: "New session" });
  assert.equal(moved.projectId, "project_new");
  assert.equal(moved.runId, "session_new");
  assert.equal(moved.message, note.message);
  assert.equal(moved.screenshot.data, note.screenshot.data);
  assert.deepEqual(moved.selection, note.selection);
});

test("creates a valid text-only note without screenshot data", () => {
  const note = createNote({
    target: createTarget({ projectName: "Storefront", runLabel: "Text QA" }),
    message: "The heading is too close to the navigation."
  });
  assert.equal(note.message, "The heading is too close to the navigation.");
  assert.equal(note.screenshot, null);
  assert.equal(note.selection, null);
});
