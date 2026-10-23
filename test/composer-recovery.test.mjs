import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { setImmediate } from "node:timers/promises";
import vm from "node:vm";
import test from "node:test";

// A small DOM adapter for the actual content script. It exercises events and
// save recovery, not layout, Chrome permissions, or installed-extension behavior.
class Element {
  constructor(tag) {
    this.tagName = tag;
    this.children = [];
    this.listeners = new Map();
    this.attributes = new Map();
    this.style = { setProperty() {} };
    this.value = "";
    this.disabled = false;
    this.textContent = "";
  }
  append(...children) { for (const child of children) { child.parent = this; this.children.push(child); } }
  replaceChildren(...children) { this.children = []; this.append(...children); }
  setAttribute(name, value) { this.attributes.set(name, value); }
  removeAttribute(name) { this.attributes.delete(name); }
  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) || [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }
  attachShadow() { this.shadowRoot = new Element("shadow"); return this.shadowRoot; }
  remove() { this.removed = true; }
  focus() {}
  get options() { return this.children.filter((child) => child.tagName === "option"); }
  get offsetParent() { return this.style.display === "none" ? null : this.parent || null; }
  click() { for (const listener of this.listeners.get("click") || []) listener({}); }
}

async function composerFixture(sendMessage) {
  const elements = [];
  const document = {
    createElement(tag) { const element = new Element(tag); elements.push(element); return element; },
    getElementById(id) { return elements.find((element) => element.id === id && !element.removed); },
    documentElement: new Element("html"),
    fonts: { add() {} }
  };
  const context = vm.createContext({
    document, console,
    FontFace: class { load() { return Promise.resolve(); } },
    window: { location: { protocol: "https:", href: "https://example.test/", pathname: "/" } },
    chrome: { runtime: { getURL: (path) => path, sendMessage, onMessage: { addListener() {} } } }
  });
  vm.runInContext(readFileSync(new URL("../content.js", import.meta.url), "utf8"), context);
  await vm.runInContext("showComposer", context)({
    target: { projectId: "project_1", projectName: "Example", runId: "session_1", runLabel: "Review" },
    workspace: { projects: [] }
  });
  return {
    textarea: elements.find((element) => element.tagName === "textarea"),
    save: elements.find((element) => element.textContent === "Save note"),
    error: elements.find((element) => element.id === "spottr-composer-error"),
    root: elements.find((element) => element.id === "spottr-root")
  };
}

test("a disconnected save retains the note, explains recovery, and permits retry", async () => {
  let attempts = 0;
  const composer = await composerFixture(async () => {
    if (++attempts === 1) throw new Error("Message channel disconnected");
    return { ok: true };
  });
  composer.textarea.value = "The navigation overlaps the heading.";
  composer.save.click();
  await setImmediate();
  assert.equal(composer.save.disabled, false);
  assert.equal(composer.save.textContent, "Save note");
  assert.match(composer.error.textContent, /try again/iu);
  assert.equal(composer.textarea.value, "The navigation overlaps the heading.");
  assert.ok(!composer.root.removed);
  composer.save.click();
  await setImmediate();
  assert.equal(attempts, 2);
  assert.equal(composer.root.removed, true);
});

test("a rejected storage response keeps the draft editable", async () => {
  const composer = await composerFixture(async () => ({ ok: false, error: "Chrome storage is full." }));
  composer.textarea.value = "Keep this observation.";
  composer.save.click();
  await setImmediate();
  assert.equal(composer.save.disabled, false);
  assert.match(composer.error.textContent, /Chrome storage is full/u);
  assert.equal(composer.textarea.value, "Keep this observation.");
  assert.ok(!composer.root.removed);
});

test("an in-flight save prevents duplicate submission and accidental dismissal", async () => {
  let finish;
  let calls = 0;
  const composer = await composerFixture(() => {
    calls += 1;
    return new Promise((resolve) => { finish = resolve; });
  });
  composer.textarea.value = "Wait for the result.";
  composer.save.click();
  composer.save.click();
  await setImmediate();
  assert.equal(calls, 1);
  assert.equal(composer.save.disabled, true);
  assert.equal(composer.textarea.disabled, true);
  for (const listener of composer.root.shadowRoot.listeners.get("keydown")) {
    listener({ key: "Escape", preventDefault() {}, stopPropagation() {} });
  }
  assert.ok(!composer.root.removed, "a pending write cannot be cancelled by dismissing its UI");
  finish({ ok: false, error: "Could not save this note." });
  await setImmediate();
  assert.equal(composer.textarea.disabled, false);
  assert.equal(composer.save.disabled, false);
});
