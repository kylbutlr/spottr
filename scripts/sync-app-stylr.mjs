import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
const root = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(import.meta.url);
const upstream = dirname(require.resolve("app-stylr/package.json"));
const check = process.argv.includes("--check");
const manifest = JSON.parse(await readFile(join(root, "app-stylr.json"), "utf8"));
const source = JSON.parse(await readFile(join(upstream, "package.json"), "utf8"));
if (manifest.version !== source.version) throw new Error("App Stylr manifest and installed package differ");
const files = new Map();
files.set("styles/app-stylr.css", await readFile(join(upstream, "adapters/css/app-stylr.css")));
files.set("styles/fonts.css", Buffer.from((await readFile(join(upstream, "adapters/css/fonts.css"), "utf8")).replaceAll("../../assets/fonts/", "../fonts/")));
for (const name of ["Geist-Variable.woff2", "GeistMono-Variable.woff2"]) files.set(`fonts/${name}`, await readFile(join(upstream, "assets/fonts", name)));
files.set("fonts/LICENSE-GEIST.txt", await readFile(join(upstream, "assets/fonts/LICENSE-GEIST.txt")));
const tokens = JSON.parse(await readFile(join(upstream, "tokens/app-stylr.json"), "utf8"));
const kebab = value => value.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
const declarations = Object.entries(tokens.themes.dark).map(([key,value]) => [`--ui-${kebab(key)}`, value]);
for (const [key,value] of Object.entries(tokens.radius)) declarations.push([`--radius-${key}`, `${value}px`]);
declarations.push(["--font-sans", `"${tokens.typography.families.sans}", ${tokens.typography.families.sansFallback}`], ["--font-mono", `"${tokens.typography.families.mono}", ${tokens.typography.families.monoFallback}`]);
const generated = declarations.map(([key,value]) => `  host.style.setProperty(${JSON.stringify(key)}, ${JSON.stringify(value)});`).join("\n");
const content = await readFile(join(root, "content.js"), "utf8");
const pattern = new RegExp(String.raw`  // BEGIN GENERATED APP STYLR SHADOW TOKENS[\s\S]*?  // END GENERATED APP STYLR SHADOW TOKENS`);
if (!pattern.test(content)) throw new Error("Missing injected-token generation markers");
files.set("content.js", Buffer.from(content.replace(pattern, `  // BEGIN GENERATED APP STYLR SHADOW TOKENS\n${generated}\n  // END GENERATED APP STYLR SHADOW TOKENS`)));

const iconOutput = join(root, "dist/app-stylr-icons");
execFileSync(process.execPath, [join(upstream, "scripts/generate-icons.mjs"), "--source", join(root, "assets/app-icon.svg"), "--output", iconOutput], { stdio: "pipe", cwd: root });
for (const name of ["chrome/icon-16.png","chrome/icon-32.png","chrome/icon-48.png","chrome/icon-128.png","web/favicon-32.png","web/apple-touch-icon-152.png","web/apple-touch-icon-167.png","web/apple-touch-icon-180.png","web/apple-touch-icon.png","web/icon-192.png","web/icon-512.png"]) files.set(`icons/${name}`, await readFile(join(iconOutput, name)));
// The pinned generator renders this 512px PNG directly from the SVG master.
files.set("icons/chrome/icon-512.png", await readFile(join(iconOutput, "web/icon-512.png")));

for (const [name, content] of files) {
 const target = join(root, name);
 if (check) { if (!(await readFile(target)).equals(content)) throw new Error(`${name} differs from the pinned source; run npm run styles`); }
 else { await mkdir(dirname(target), { recursive:true }); await writeFile(target, content); }
}
console.log(`${check ? "Verified" : "Generated"} App Stylr ${source.version} adapters, fonts and icons.`);
