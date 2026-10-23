import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const manifest = JSON.parse(readFileSync(new URL("../manifest.json", import.meta.url), "utf8"));
const popupHtml = readFileSync(new URL("../popup.html", import.meta.url), "utf8");
const popupSource = readFileSync(new URL("../popup.js", import.meta.url), "utf8");

test("popup provides a clipboard JSON export using the same payload serializer", () => {
  assert.ok(manifest.permissions.includes("clipboardWrite"));
  assert.match(popupHtml, /id="copy-json"/u);
  assert.match(popupSource, /navigator\.clipboard\.writeText\(exportJson\(await exportPayload\(\)\)\)/u);
  assert.match(popupSource, /function exportJson\(payload\)/u);
});
