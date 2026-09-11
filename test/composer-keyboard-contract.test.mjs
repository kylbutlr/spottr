import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const contentSource = readFileSync(new URL("../content.js", import.meta.url), "utf8");

test("composer consumes keyboard events before they reach the host page", () => {
  assert.match(contentSource, /shadow\.addEventListener\("keydown"/u);
  assert.match(contentSource, /shadow\.addEventListener\("keypress"/u);
  assert.match(contentSource, /shadow\.addEventListener\("keyup"/u);
  assert.match(contentSource, /event\.stopPropagation\(\)/u);
  assert.match(contentSource, /event\.key === "Escape"/u);
  assert.match(contentSource, /event\.key !== "Tab"/u);
  assert.match(contentSource, /event\.key !== "Enter"/u);
  assert.match(contentSource, /event\.key !== "Enter"\s*\|\| event\.shiftKey/u);
  assert.match(contentSource, /save\.addEventListener\("click", \(\) => void submit\(\)\)/u);
});
