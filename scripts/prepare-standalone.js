// After `next build`, prepare the standalone bundle:
// 1. Copy .next/static + public/ into .next/standalone (Next.js needs them at runtime)
// 2. Rebuild better-sqlite3 against Electron's Node ABI inside standalone/node_modules
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = process.cwd();
const standalone = path.join(root, ".next", "standalone");

function copyDir(src, dest, ignore = []) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (ignore.includes(entry.name)) continue;
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d, ignore);
    else fs.copyFileSync(s, d);
  }
}

console.log("→ Copying .next/static into standalone");
copyDir(path.join(root, ".next", "static"), path.join(standalone, ".next", "static"));

console.log("→ Copying public/ into standalone (excluding notes/)");
copyDir(path.join(root, "public"), path.join(standalone, "public"), ["notes"]);

console.log("→ Rebuilding native modules in standalone for Electron ABI");
const electronVersion = require(path.join(root, "node_modules", "electron", "package.json")).version;
const r = spawnSync(
  path.join(root, "node_modules", ".bin", "electron-rebuild"),
  [
    "--version", electronVersion,
    "--module-dir", standalone,
    "--only", "better-sqlite3",
    "--types", "prod,optional",
  ],
  { stdio: "inherit", cwd: root },
);
if (r.status !== 0) {
  console.error("electron-rebuild failed");
  process.exit(r.status || 1);
}

console.log("✓ standalone ready");
