import assert from "node:assert/strict";
import { test } from "node:test";

test("shortcut messages preserve empty and assigned Chrome command bindings", async (t) => {
  const previousChrome = globalThis.chrome;
  t.after(() => { globalThis.chrome = previousChrome; });
  let onMessage;
  let commands = [];
  globalThis.chrome = {
    storage: { local: { setAccessLevel: async () => undefined } },
    runtime: {
      onMessage: { addListener: (listener) => { onMessage = listener; } },
      onInstalled: { addListener: () => undefined }
    },
    commands: {
      getAll: async () => commands,
      onCommand: { addListener: () => undefined }
    }
  };
  await import("../background.js?shortcut-message-contract");
  const readShortcuts = () => new Promise((resolve) => {
    assert.equal(onMessage({ type: "qa-get-shortcuts" }, {}, resolve), true);
  });

  commands = [
    { name: "capture-qa-note", shortcut: "" },
    { name: "add-qa-note", shortcut: "" }
  ];
  assert.deepEqual(await readShortcuts(), { ok: true, result: { capture: "", note: "" } });

  commands = [];
  assert.deepEqual(await readShortcuts(), { ok: true, result: { capture: "", note: "" } });

  commands = [
    { name: "capture-qa-note", shortcut: "Command+Shift+S" },
    { name: "add-qa-note", shortcut: "Alt+N" }
  ];
  assert.deepEqual(await readShortcuts(), {
    ok: true,
    result: { capture: "Command+Shift+S", note: "Alt+N" }
  });
});
