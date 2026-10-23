import assert from "node:assert/strict";
import { setImmediate } from "node:timers/promises";
import test from "node:test";

async function storageFixture() {
  const transactions = [];
  globalThis.indexedDB = {
    open() {
      const request = {};
      queueMicrotask(() => {
        request.result = {
          transaction(store, mode) {
            const requests = [];
            const transaction = {
              store, mode, requests,
              objectStore: () => ({
                put(value) { const request = { value }; requests.push(request); return request; },
                delete(key) { const request = { key }; requests.push(request); return request; },
                clear() { return {}; }
              })
            };
            transactions.push(transaction);
            return transaction;
          }
        };
        request.onsuccess();
      });
      return request;
    }
  };
  const storage = await import(`../shared/storage.js?transaction-test=${Math.random()}`);
  return { storage, transactions };
}

test("saving a note waits for the transaction to commit", async () => {
  const { storage, transactions } = await storageFixture();
  let settled = false;
  const note = { id: "note_1", message: "Keep this note" };
  const pending = storage.putNote(note).then((value) => { settled = true; return value; });
  await setImmediate();
  const transaction = transactions[0];
  transaction.requests[0].onsuccess?.();
  await setImmediate();
  assert.equal(settled, false, "a successful request is not a committed transaction");
  transaction.oncomplete();
  assert.equal(await pending, note);
});

test("a transaction abort after request success rejects the save", async () => {
  const { storage, transactions } = await storageFixture();
  const pending = storage.putNote({ id: "note_1" });
  const outcome = pending.then(() => ({ saved: true }), (error) => ({ error }));
  await setImmediate();
  const transaction = transactions[0];
  transaction.requests[0].onsuccess?.();
  transaction.error = { name: "QuotaExceededError" };
  transaction.onabort?.();
  const result = await outcome;
  assert.match(result.error?.message || "", /Chrome storage is full/u);
});

test("note and capture-draft deletion wait for commit", async () => {
  for (const method of ["deleteNote", "deleteCaptureDraft"]) {
    const { storage, transactions } = await storageFixture();
    let settled = false;
    const pending = storage[method]("record_1").then(() => { settled = true; });
    await setImmediate();
    const transaction = transactions[0];
    transaction.requests[0].onsuccess?.();
    await setImmediate();
    assert.equal(settled, false, `${method} must wait for commit`);
    transaction.oncomplete();
    await pending;
  }
});

test("a failed database open can be retried without reloading the extension", async () => {
  let opens = 0;
  globalThis.indexedDB = {
    open() {
      opens += 1;
      const request = {};
      queueMicrotask(() => {
        request.error = { name: "UnknownError" };
        request.onerror();
      });
      return request;
    }
  };
  const storage = await import(`../shared/storage.js?retry-test=${Math.random()}`);
  await assert.rejects(storage.listNotes(), /Could not open local QA note storage/u);
  await assert.rejects(storage.listNotes(), /Could not open local QA note storage/u);
  assert.equal(opens, 2);
});
