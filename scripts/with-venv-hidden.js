// Turbopack panics on the .venv/bin/python symlink (it points outside the project root).
// Move .venv out of the way for the duration of a child command, then restore it.
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = process.cwd();
const venv = path.join(root, ".venv");
const hidden = path.join(root, "..", `.venv-hidden-${process.pid}`);

const [, , cmd, ...args] = process.argv;
if (!cmd) {
  console.error("Usage: with-venv-hidden.js <cmd> [args...]");
  process.exit(2);
}

let moved = false;
function restore() {
  if (moved && fs.existsSync(hidden) && !fs.existsSync(venv)) {
    try { fs.renameSync(hidden, venv); } catch (err) { console.error("restore failed:", err.message); }
  }
}

process.on("SIGINT", () => { restore(); process.exit(130); });
process.on("SIGTERM", () => { restore(); process.exit(143); });

if (fs.existsSync(venv)) {
  fs.renameSync(venv, hidden);
  moved = true;
}

const result = spawnSync(cmd, args, { stdio: "inherit", shell: true, cwd: root });
restore();
process.exit(result.status ?? 1);
