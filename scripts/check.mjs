import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { PACKAGE_FILES } from "./package-files.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const files = [
  join(root, "background.js"),
  join(root, "content.js"),
  join(root, "options.js"),
  join(root, "popup.js"),
  join(root, "viewer.js"),
  join(root, "shared", "model.js"),
  join(root, "shared", "storage.js"),
  join(root, "shared", "workspace.js"),
  join(root, "welcome.js")
];

for (const file of files) {
  execFileSync(process.execPath, ["--check", file], { stdio: "inherit" });
}

const manifest = JSON.parse(readFileSync(join(root, "manifest.json"), "utf8"));
const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
if (manifest.manifest_version !== 3) throw new Error("Manifest must use Manifest V3.");
if (manifest.name !== "Spottr") throw new Error("Manifest name must remain Spottr.");
if (manifest.version !== packageJson.version) throw new Error("Manifest and package versions must match.");
if (manifest.description.length > 132) throw new Error("Manifest description must be 132 characters or fewer.");
if (manifest.commands["capture-qa-note"]?.suggested_key) throw new Error("Shortcut must remain user-configured.");
const expectedPermissions = ["activeTab", "clipboardWrite", "scripting", "storage"];
if ([...manifest.permissions].sort().join(",") !== expectedPermissions.sort().join(",")) {
  throw new Error("Manifest permissions changed without updating the reviewed minimum set.");
}
if (manifest.host_permissions?.length) throw new Error("Spottr must not request persistent host permissions.");
for (const iconPath of Object.values(manifest.icons)) {
  if (!readdirSync(join(root, "icons", "chrome")).includes(iconPath.split("/").at(-1))) {
    throw new Error(`Missing extension icon: ${iconPath}`);
  }
}
if (!readdirSync(join(root, "shared")).includes("model.js")) throw new Error("Shared model is missing.");
if (!readdirSync(join(root, "shared")).includes("workspace.js")) throw new Error("Shared workspace lifecycle is missing.");
for (const path of PACKAGE_FILES) {
  readFileSync(join(root, path));
}
console.log(`Checked ${files.length} JavaScript files, ${PACKAGE_FILES.length} packaged files, and the Manifest V3 extension scaffold.`);
