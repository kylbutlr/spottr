import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const contentSource = readFileSync(new URL("../content.js", import.meta.url), "utf8");

test("selection removes the overlay and waits for paint before requesting the screenshot", () => {
  assert.match(contentSource, /function waitForPaint\(\)/u);
  assert.match(contentSource, /await waitForPaint\(\);\s*await waitForPaint\(\);/u);
  assert.match(contentSource, /(?:removeRoot|closeSelection)\(\);\s*void sendSelection\(/u);
});

test("selection overlay leaves the active rectangle clear while dragging", () => {
  assert.match(contentSource, /background: "transparent"/u);
  assert.match(contentSource, /const updateMask =/u);
  assert.match(contentSource, /const shadeParts =/u);
});
