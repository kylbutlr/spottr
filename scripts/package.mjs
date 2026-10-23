import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PACKAGE_FILES } from "./package-files.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const manifest = JSON.parse(readFileSync(join(root, "manifest.json"), "utf8"));
const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
if (manifest.version !== packageJson.version) throw new Error("Manifest and package versions must match.");

const missing = PACKAGE_FILES.filter((path) => !existsSync(join(root, path)));
if (missing.length) throw new Error(`Missing package files: ${missing.join(", ")}`);

const dist = join(root, "dist");
const zipPath = join(dist, `spottr-v${manifest.version}.zip`);
const checksumPath = `${zipPath}.sha256`;
mkdirSync(dist, { recursive: true });
rmSync(zipPath, { force: true });
rmSync(checksumPath, { force: true });

const temporaryRoot = mkdtempSync(join(tmpdir(), "spottr-package-"));
const staging = join(temporaryRoot, "spottr");
const stableTimestamp = new Date("2000-01-01T00:00:00.000Z");

try {
  for (const path of PACKAGE_FILES) {
    const destination = join(staging, path);
    mkdirSync(dirname(destination), { recursive: true });
    copyFileSync(join(root, path), destination);
    utimesSync(destination, stableTimestamp, stableTimestamp);
  }

  execFileSync("zip", ["-X", "-q", zipPath, ...PACKAGE_FILES], { cwd: staging, stdio: "inherit" });
  const checksum = createHash("sha256").update(readFileSync(zipPath)).digest("hex");
  writeFileSync(checksumPath, `${checksum}  ${basename(zipPath)}\n`);
  console.log(`Created ${zipPath}`);
  console.log(`SHA-256 ${checksum}`);
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}
