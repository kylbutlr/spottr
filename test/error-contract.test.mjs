import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const backgroundSource = readFileSync(new URL("../background.js", import.meta.url), "utf8");
const contentSource = readFileSync(new URL("../content.js", import.meta.url), "utf8");
const popupSource = readFileSync(new URL("../popup.js", import.meta.url), "utf8");
const storageSource = readFileSync(new URL("../shared/storage.js", import.meta.url), "utf8");

test("restricted pages and capture failures have actionable user messages", () => {
  assert.match(backgroundSource, /does not have access to local files/u);
  assert.match(backgroundSource, /openRestrictedEditor\(tab/u);
  assert.match(backgroundSource, /Spottr could not open the screenshot editor/u);
  assert.match(backgroundSource, /Chrome could not capture this viewport/u);
  assert.doesNotMatch(backgroundSource, /spottr\.invalid/u);
  assert.match(contentSource, /role", "alertdialog"/u);
  assert.match(contentSource, /Capture unavailable/u);
});

test("copy and export failures point to the available fallback", () => {
  assert.match(popupSource, /Could not copy JSON\. Use Export JSON instead/u);
  assert.match(popupSource, /Could not download the JSON export\. Try Copy JSON instead/u);
});

test("storage quota failures explain how to preserve and recover data", () => {
  assert.match(storageSource, /QuotaExceededError/u);
  assert.match(storageSource, /Export important QA sessions/u);
  assert.match(storageSource, /delete older screenshot-backed notes/u);
});
