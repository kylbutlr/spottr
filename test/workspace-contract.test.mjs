import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const backgroundSource = readFileSync(new URL("../background.js", import.meta.url), "utf8");
const popupCss = readFileSync(new URL("../popup.css", import.meta.url), "utf8");
const popupHtml = readFileSync(new URL("../popup.html", import.meta.url), "utf8");
const popupSource = readFileSync(new URL("../popup.js", import.meta.url), "utf8");

test("workspace controls support project and session switching", () => {
  assert.match(popupHtml, /id="project-select"/u);
  assert.match(popupHtml, /id="session-select"/u);
  assert.match(popupHtml, /for="workspace-name"/u);
  assert.match(popupHtml, /placeholder="Project name or session label"/u);
  assert.doesNotMatch(popupHtml, /id="workspace-state"/u);
  assert.doesNotMatch(popupHtml, /id="new-project"/u);
  assert.doesNotMatch(popupHtml, /id="new-session"/u);
  assert.match(popupSource, /type: "qa-select-project"/u);
  assert.match(popupSource, /type: "qa-select-session"/u);
  assert.match(popupSource, /__new_project__/u);
  assert.match(popupSource, /__new_session__/u);
  assert.match(popupSource, /cancel-editor.*closeEditor/isu);
  assert.match(popupCss, /\.project-editor\[hidden\]\s*\{\s*display:\s*none\s*;\s*\}/u);
  assert.match(popupHtml, /<div class="capture-actions">[\s\S]*<button id="capture"[\s\S]*<button id="note-only"/u);
  assert.match(popupCss, /\.capture-actions\s*\{[\s\S]*display:\s*grid;[\s\S]*grid-template-columns:\s*1fr/u);
  assert.ok(popupHtml.indexOf('class="cleanup-actions"') > popupHtml.indexOf('<section class="recent">'));
  assert.match(popupSource, /type: "qa-move-note"/u);
  assert.match(popupSource, /Create new project\.\.\./u);
  assert.match(backgroundSource, /case "qa-create-project"/u);
  assert.match(backgroundSource, /case "qa-create-session"/u);
  assert.match(backgroundSource, /case "qa-move-note"/u);
});

test("dashboard and export stay scoped to the active session", () => {
  assert.match(backgroundSource, /note\.projectId === target\.projectId && note\.runId === target\.runId/u);
  assert.match(backgroundSource, /case "qa-clear-session"/u);
  assert.match(backgroundSource, /case "qa-clear-project"/u);
  assert.match(backgroundSource, /case "qa-delete-session"/u);
  assert.match(backgroundSource, /case "qa-delete-project"/u);
  assert.match(backgroundSource, /deleteNotesWhere\(/u);
  assert.match(backgroundSource, /reconcileWorkspaceProjects\(projects, notes, legacyOverride\)/u);
  assert.doesNotMatch(backgroundSource, /removeStoredProjectIfEmpty/u);
  assert.match(backgroundSource, /async function clearActiveProject\(\)[\s\S]*?deleteNotesWhere\([\s\S]*?return \{ \.\.\.\(await dashboard\(\)\), removed \};/u);
  assert.doesNotMatch(backgroundSource, /pruneEmptyProjects/u);
  assert.match(popupSource, /No saved projects yet/u);
  assert.match(backgroundSource, /draftSession: true/u);
  assert.match(popupSource, /Delete empty session/u);
  assert.match(popupSource, /Delete empty project/u);
});
