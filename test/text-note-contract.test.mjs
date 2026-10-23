import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const manifest = JSON.parse(readFileSync(new URL("../manifest.json", import.meta.url), "utf8"));
const backgroundSource = readFileSync(new URL("../background.js", import.meta.url), "utf8");
const contentSource = readFileSync(new URL("../content.js", import.meta.url), "utf8");
const optionsHtml = readFileSync(new URL("../options.html", import.meta.url), "utf8");
const optionsSource = readFileSync(new URL("../options.js", import.meta.url), "utf8");
const popupHtml = readFileSync(new URL("../popup.html", import.meta.url), "utf8");
const popupSource = readFileSync(new URL("../popup.js", import.meta.url), "utf8");

test("manifest exposes a separate configurable text-only note command", () => {
  assert.match(manifest.commands["add-qa-note"].description, /without a screenshot/u);
  assert.match(backgroundSource, /command === "add-qa-note"/u);
  assert.match(backgroundSource, /case "qa-start-note"/u);
  assert.match(backgroundSource, /case "qa-get-shortcuts"/u);
  assert.match(optionsSource, /type: "qa-get-shortcuts"/u);
  assert.match(optionsHtml, /id="capture-shortcut"/u);
  assert.match(optionsHtml, /id="note-shortcut"/u);
});

test("text-only notes reuse the composer and save without screenshot data", () => {
  assert.match(popupHtml, /id="note-only"/u);
  assert.match(popupHtml, /id="note-shortcut"/u);
  assert.match(popupSource, /type: "qa-start-note"/u);
  assert.match(contentSource, /const capture = message\.capture \|\|/u);
  assert.match(contentSource, /const hasScreenshot = Boolean\(message\.screenshot && capture\.selection\)/u);
  assert.match(contentSource, /screenshot: cropped \? \{ mimeType: "image\/webp", data: cropped \} : null/u);
});
