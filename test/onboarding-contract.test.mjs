import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const backgroundSource = readFileSync(new URL("../background.js", import.meta.url), "utf8");
const popupHtml = readFileSync(new URL("../popup.html", import.meta.url), "utf8");
const popupSource = readFileSync(new URL("../popup.js", import.meta.url), "utf8");
const welcomeHtml = readFileSync(new URL("../welcome.html", import.meta.url), "utf8");

test("fresh installation opens a public-beta onboarding page", () => {
  assert.match(backgroundSource, /chrome\.runtime\.onInstalled\.addListener/u);
  assert.match(backgroundSource, /reason === "install"/u);
  assert.match(backgroundSource, /chrome\.runtime\.getURL\("welcome\.html"\)/u);
  assert.match(welcomeHtml, /Your first QA session/u);
  assert.match(welcomeHtml, /Capture area/u);
  assert.match(welcomeHtml, /Add text-only note/u);
  assert.match(welcomeHtml, /Copy JSON or Export JSON/u);
  assert.match(welcomeHtml, /Nothing leaves the browser/u);
});

test("the empty popup makes the first capture and privacy boundary obvious", () => {
  assert.match(popupHtml, /id="first-use"/u);
  assert.match(popupHtml, /Local by default/u);
  assert.match(popupHtml, /id="capture"[\s\S]*Capture area/u);
  assert.match(popupHtml, /Add text-only note/u);
  assert.match(popupSource, /workspace\.totalNoteCount > 0/u);
});
