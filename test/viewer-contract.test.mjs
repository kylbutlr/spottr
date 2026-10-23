import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const popupSource = readFileSync(new URL("../popup.js", import.meta.url), "utf8");
const storageSource = readFileSync(new URL("../shared/storage.js", import.meta.url), "utf8");
const viewerHtml = readFileSync(new URL("../viewer.html", import.meta.url), "utf8");
const viewerSource = readFileSync(new URL("../viewer.js", import.meta.url), "utf8");

test("thumbnail clicks open the dedicated screenshot viewer", () => {
  assert.match(popupSource, /chrome\.runtime\.getURL\("viewer\.html"\)/u);
  assert.match(popupSource, /chrome\.tabs\.create\(\{ url: viewerUrl\.toString\(\) \}\)/u);
  assert.match(storageSource, /export async function getNote\(noteId\)/u);
  assert.match(viewerHtml, /id="screenshot"/u);
  assert.match(viewerHtml, /viewer\.js/u);
  assert.match(viewerSource, /new URLSearchParams\(location\.search\)/u);
  assert.match(viewerSource, /getNote\(noteId\)/u);
  assert.match(viewerSource, /screenshot\.src = note\.screenshot\.data/u);
});
