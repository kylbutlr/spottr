import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const backgroundSource = readFileSync(new URL("../background.js", import.meta.url), "utf8");
const contentSource = readFileSync(new URL("../content.js", import.meta.url), "utf8");

test("the note composer can confirm or change project and session before saving", () => {
  assert.match(contentSource, /aria-label", "Project"/u);
  assert.match(contentSource, /aria-label", "QA session"/u);
  assert.match(contentSource, /Create new project/u);
  assert.match(contentSource, /Create new session/u);
  assert.match(contentSource, /newProjectName/u);
  assert.match(contentSource, /newSessionLabel/u);
  assert.match(contentSource, /assignment:/u);
  assert.match(backgroundSource, /workspace,/u);
  assert.match(backgroundSource, /assignNoteDraft/u);
});
