import assert from "node:assert/strict";
import { test } from "node:test";
import { mapDisplaySelection } from "../shared/capture-geometry.js";

test("restricted-page selection maps a scaled editor rectangle to source viewport coordinates", () => {
  assert.deepEqual(
    mapDisplaySelection(
      { x: 100, y: 50, width: 150, height: 100 },
      { width: 600, height: 400 },
      { width: 1200, height: 800 }
    ),
    { x: 200, y: 100, width: 300, height: 200 }
  );
});
