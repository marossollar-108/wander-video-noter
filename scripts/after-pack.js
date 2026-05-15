// After electron-builder packs the .app, copy .next/standalone/node_modules
// into the packaged standalone dir. electron-builder deduplicates and moves
// these into app.asar — but server.js looks for them relative to its own dir.
const fs = require("fs");
const path = require("path");

exports.default = async function afterPack(ctx) {
  const appOutDir = ctx.appOutDir;
  // mac: appOutDir/<ProductName>.app/Contents/Resources/app/standalone
  // We need to find Resources/app/standalone for each packaged app.
  const apps = fs.readdirSync(appOutDir).filter((n) => n.endsWith(".app"));
  if (apps.length === 0) {
    console.log("[afterPack] no .app found in", appOutDir);
    return;
  }
  const appDir = path.join(appOutDir, apps[0]);
  const standaloneDir = path.join(appDir, "Contents", "Resources", "app", "standalone");
  const targetNodeModules = path.join(standaloneDir, "node_modules");
  const sourceNodeModules = path.resolve(process.cwd(), ".next", "standalone", "node_modules");

  if (!fs.existsSync(sourceNodeModules)) {
    console.log("[afterPack] standalone source missing:", sourceNodeModules);
    return;
  }
  if (fs.existsSync(targetNodeModules)) {
    console.log("[afterPack] already present, skipping:", targetNodeModules);
    return;
  }

  console.log("[afterPack] copying node_modules into", targetNodeModules);
  copyDir(sourceNodeModules, targetNodeModules);
  console.log("[afterPack] done");
};

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isSymbolicLink()) {
      try {
        const target = fs.readlinkSync(s);
        fs.symlinkSync(target, d);
      } catch { /* ignore */ }
    } else if (entry.isDirectory()) {
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
      // Preserve executable bit (e.g. .bin/* shims)
      try {
        const mode = fs.statSync(s).mode;
        fs.chmodSync(d, mode);
      } catch { /* ignore */ }
    }
  }
}
