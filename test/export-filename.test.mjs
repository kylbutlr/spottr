import assert from "node:assert/strict";
import { test } from "node:test";
import { createNote, createQaExport, qaExportFilename } from "../shared/model.js";

test("download names distinguish sessions without changing exported evidence", () => {
  const target = { projectName: "Fieldnotes", runLabel: "Mobile review" };
  const note = createNote({ target, message: "Spacing", pageUrl: "https://example.test/?preview_token=fictional" });
  const payload = { ...createQaExport([note], target), exportedAt: "2026-11-07T01:00:00Z" };
  const before = JSON.stringify(payload);
  assert.equal(qaExportFilename(payload), "spottr-fieldnotes-mobile-review-2026-11-07.json");
  assert.equal(JSON.stringify(payload), before);
  assert.match(payload.notes[0].url, /preview_token=fictional/u);
  assert.equal(qaExportFilename({ ...payload, target: { ...target, runLabel: "Desktop review" } }),
    "spottr-fieldnotes-desktop-review-2026-11-07.json");
});

test("download labels are bounded and safe for reserved characters and empty names", () => {
  const payload = { exportedAt: "2026-11-07T01:00:00Z", target: { projectName: "../CON:<Café>\\", runLabel: "A?B* / review" } };
  assert.equal(qaExportFilename(payload), "spottr-con-cafe-a-b-review-2026-11-07.json");
  payload.target = { projectName: "p".repeat(500), runLabel: "s".repeat(500) };
  const filename = qaExportFilename(payload);
  assert.ok(filename.length < 128);
  assert.doesNotMatch(filename, /[<>:"/\\|?*\x00-\x1f]/u);
  assert.equal(qaExportFilename({ ...payload, target: { projectName: "...", runLabel: "💡" } }),
    "spottr-project-session-2026-11-07.json");
});
