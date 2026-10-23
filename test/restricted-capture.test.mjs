import assert from "node:assert/strict";
import { test } from "node:test";

test("Capture area opens a screenshot editor when Chrome hides a restricted tab URL", async () => {
  let onMessage;
  const calls = [];
  const drafts = new Map();
  let noteReads = 0;
  globalThis.indexedDB = {
    open: () => {
      const request = {};
      queueMicrotask(() => {
        request.result = {
          objectStoreNames: { contains: () => false },
          createObjectStore: () => ({ createIndex: () => undefined }),
          transaction: (storeName) => {
            const transaction = {
              objectStore: () => ({
                clear: () => drafts.clear(),
                put: (draft) => drafts.set(draft.id, draft),
                get: (id) => {
                  const result = {};
                  queueMicrotask(() => { result.result = drafts.get(id); result.onsuccess?.(); });
                  return result;
                },
                getAll: () => {
                  if (storeName === "notes") noteReads += 1;
                  const result = {};
                  queueMicrotask(() => { result.result = storeName === "notes" ? [] : [...drafts.values()]; result.onsuccess?.(); });
                  return result;
                }
              })
            };
            queueMicrotask(() => transaction.oncomplete?.());
            return transaction;
          }
        };
        request.onupgradeneeded?.();
        request.onsuccess?.();
      });
      return request;
    }
  };
  globalThis.chrome = {
    storage: { local: {
      setAccessLevel: async () => undefined,
      get: async () => ({}),
      set: async () => undefined,
      remove: async () => undefined
    } },
    tabs: {
      query: async () => [{ id: 7, windowId: 4 }],
      captureVisibleTab: async (windowId, options) => {
        calls.push(["capture", windowId, options]);
        return "data:image/png;base64,example";
      },
      create: async (options) => { calls.push(["create", options]); }
    },
    runtime: {
      getURL: (path) => `chrome-extension://spottr/${path}`,
      onMessage: { addListener: (listener) => { onMessage = listener; } },
      onInstalled: { addListener: () => undefined }
    },
    commands: { onCommand: { addListener: () => undefined } }
  };
  await import(`../background.js?restricted-capture=${Date.now()}`);
  const response = await new Promise((resolve) => onMessage({ type: "qa-start-capture" }, {}, resolve));
  assert.equal(response.ok, true, response.error);
  assert.equal(calls[0]?.[0], "capture");
  assert.equal(calls[0]?.[1], 4);
  assert.match(calls[1]?.[1]?.url || "", /^chrome-extension:\/\/spottr\/restricted-capture\.html/u);
  assert.ok(!calls.some(([method]) => method === "executeScript"));
  const editorUrl = calls[1][1].url;
  const captureId = new URL(editorUrl).searchParams.get("id");
  const editorResponse = await new Promise((resolve) => onMessage(
    { type: "qa-get-restricted-capture", id: captureId },
    { url: editorUrl },
    resolve
  ));
  assert.equal(editorResponse.ok, true, editorResponse.error);
  assert.equal(editorResponse.result.draft.screenshot, "data:image/png;base64,example");
  assert.equal(editorResponse.result.workspace.target.projectName, "Restricted page");

  calls.length = 0;
  const textResponse = await new Promise((resolve) => onMessage({ type: "qa-start-note" }, {}, resolve));
  assert.equal(textResponse.ok, true, textResponse.error);
  assert.deepEqual(calls.map(([method]) => method), ["create"], "text-only notes must not take a screenshot");

  for (const type of ["qa-get-dashboard", "qa-export"]) {
    noteReads = 0;
    const result = await new Promise((resolve) => onMessage({ type }, {}, resolve));
    assert.equal(result.ok, true, result.error);
    assert.equal(noteReads, 1, `${type} should reuse one snapshot of screenshot-bearing notes`);
  }
});
