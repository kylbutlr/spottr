import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const contentSource = await readFile(new URL("../content.js", import.meta.url), "utf8");

test("selection pointer listeners stay on the hit-testable full-screen host", () => {
  assert.match(contentSource, /root\.addEventListener\("pointerdown"/u);
  assert.match(contentSource, /root\.addEventListener\("pointermove"/u);
  assert.match(contentSource, /root\.addEventListener\("pointerup"/u);
  assert.doesNotMatch(contentSource, /shadow\.addEventListener\("pointer(?:down|move|up)"/u);
});

test("Escape cancellation stays active after a non-Escape keydown", () => {
  const listener = contentSource.match(/document\.addEventListener\("keydown",[\s\S]*?\}\);/u)?.[0];
  assert.ok(listener, "selection should register a document keydown listener");
  assert.match(listener, /capture:\s*true/u);
  assert.doesNotMatch(listener, /once:\s*true/u);
});
