import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const manifest = JSON.parse(readFileSync(new URL("../manifest.json", import.meta.url), "utf8"));
const backgroundSource = readFileSync(new URL("../background.js", import.meta.url), "utf8");
const privacy = readFileSync(new URL("../PRIVACY.md", import.meta.url), "utf8");

test("manifest uses the reviewed minimum permission set without persistent host access", () => {
  assert.deepEqual([...manifest.permissions].sort(), ["activeTab", "clipboardWrite", "scripting", "storage"]);
  assert.equal(manifest.host_permissions, undefined);
  assert.match(backgroundSource, /setAccessLevel\?\.\(\{ accessLevel: "TRUSTED_CONTEXTS" \}\)/u);
});

test("privacy notice covers captured data, local storage, export, and deletion", () => {
  for (const phrase of ["raw page URL", "page title", "Device pixel ratio", "IndexedDB", "chrome.storage.local", "What leaves the browser", "Retention and deletion", "Limited Use disclosure"]) {
    assert.match(privacy, new RegExp(phrase.replace(".", "\\."), "u"));
  }
});
