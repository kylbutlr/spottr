import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { PACKAGE_FILES } from "../scripts/package-files.mjs";

const manifest = JSON.parse(readFileSync(new URL("../manifest.json", import.meta.url), "utf8"));
const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const example = JSON.parse(readFileSync(new URL("../docs/export-example.json", import.meta.url), "utf8"));
const appStylr = JSON.parse(readFileSync(new URL("../app-stylr.json", import.meta.url), "utf8"));
const releaseGuide = readFileSync(new URL("../docs/releasing.md", import.meta.url), "utf8");
const storeListing = readFileSync(new URL("../docs/chrome-web-store-listing.md", import.meta.url), "utf8");

test("release versions stay aligned and the package is a public runtime allowlist", () => {
  assert.equal(manifest.version, packageJson.version);
  assert.equal(packageJson.scripts.build, "npm run check && npm test && node scripts/package.mjs");
  assert.ok(PACKAGE_FILES.includes("manifest.json"));
  assert.ok(PACKAGE_FILES.includes("welcome.html"));
  assert.ok(PACKAGE_FILES.includes("privacy.html"));
  assert.ok(PACKAGE_FILES.includes("support.html"));
  for (const path of PACKAGE_FILES) {
    assert.doesNotMatch(path, /(?:^|\/)(?:\.git|test|docs|node_modules)(?:\/|$)/u);
    assert.doesNotMatch(path, /(?:README|CONTEXT|AGENTS|package\.json)/u);
  }
});

test("the public repository uses MIT and pins App Stylr v1", () => {
  assert.match(readFileSync(new URL("../LICENSE", import.meta.url), "utf8"), /MIT License/u);
  assert.equal(appStylr.version, "1.0.0");
  assert.equal(appStylr.release, "https://github.com/kylbutlr/app-stylr/tree/v1.0.0");
  assert.match(
    readFileSync(new URL("../styles/app-stylr.css", import.meta.url), "utf8"),
    /--app-stylr-version: "1\.0\.0"/u,
  );
});

test("public release documentation matches the repository and checksum workflow", () => {
  assert.match(releaseGuide, /cd dist\nshasum -a 256 -c spottr-v0\.2\.0\.zip\.sha256/u);
  assert.doesNotMatch(storeListing, /repository is currently private/u);
  assert.match(storeListing, /https:\/\/kylbutlr\.com\/apps\/spottr/u);
  assert.match(storeListing, /https:\/\/github\.com\/kylbutlr\/spottr\/issues/u);
});

test("the published export example is safe and follows schema version 1", () => {
  assert.equal(example.schemaVersion, 1);
  assert.equal(example.target.projectName, "Example storefront");
  assert.equal(example.notes.length, 2);
  assert.equal(example.notes[0].screenshot.mimeType, "image/webp");
  assert.equal(example.notes[1].screenshot, null);
  assert.match(example.notes[0].url, /^https:\/\/example\.test\//u);
  assert.doesNotMatch(JSON.stringify(example), /(?:shopify|shortcut|sdg|kyle|\/Users\/)/iu);
});
