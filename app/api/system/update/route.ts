import { execFile, spawn } from "child_process";
import { promisify } from "util";

const exec = promisify(execFile);

export const runtime = "nodejs";
export const maxDuration = 300;

async function git(args: string[]): Promise<string> {
  const { stdout } = await exec("git", args, { cwd: process.cwd() });
  return stdout.trim();
}

function runStreamed(cmd: string, args: string[]): Promise<{ code: number; out: string }> {
  return new Promise((resolve) => {
    const proc = spawn(cmd, args, { cwd: process.cwd() });
    let out = "";
    proc.stdout.on("data", (c: Buffer) => { out += c.toString(); });
    proc.stderr.on("data", (c: Buffer) => { out += c.toString(); });
    proc.on("exit", (code) => resolve({ code: code ?? 1, out: out.trim() }));
    proc.on("error", (err) => resolve({ code: 1, out: err.message }));
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const allowDirty = !!body.allowDirty;
    const runNpmInstall = body.runNpmInstall !== false;

    // Check for uncommitted local changes
    const dirty = await git(["status", "--porcelain"]);
    if (dirty && !allowDirty) {
      return Response.json({
        ok: false,
        reason: "dirty",
        message: "V projekte sú nezachované lokálne zmeny. Najprv ich commitni alebo stashni.",
        files: dirty.split("\n").slice(0, 20),
      }, { status: 409 });
    }

    // Fetch remote
    await git(["fetch", "--all", "--prune"]);

    const branch = await git(["rev-parse", "--abbrev-ref", "HEAD"]);
    const upstream = await git(["rev-parse", "--abbrev-ref", `${branch}@{u}`]).catch(() => null);
    if (!upstream) {
      return Response.json({
        ok: false,
        reason: "no_upstream",
        message: `Branch '${branch}' nemá nastavený upstream remote.`,
      }, { status: 422 });
    }

    const behind = parseInt(await git(["rev-list", "--count", `HEAD..@{u}`]), 10);
    if (behind === 0) {
      const commit = await git(["rev-parse", "--short", "HEAD"]);
      return Response.json({
        ok: true,
        updated: false,
        message: "Si na najnovšej verzii.",
        commit,
      });
    }

    // List incoming commits before pulling
    const incoming = await git(["log", "--pretty=%h %s", `HEAD..@{u}`]);

    // Check which files will change
    const changedFiles = (await git(["diff", "--name-only", "HEAD", "@{u}"]))
      .split("\n")
      .filter(Boolean);

    // Pull
    const pull = await runStreamed("git", ["pull", "--ff-only"]);
    if (pull.code !== 0) {
      return Response.json({
        ok: false,
        reason: "pull_failed",
        message: pull.out || "git pull zlyhalo",
      }, { status: 500 });
    }

    // npm install if package files changed
    const needsNpm = changedFiles.some((f) => f === "package.json" || f === "package-lock.json");
    let npmOut = "";
    if (needsNpm && runNpmInstall) {
      const npm = await runStreamed("npm", ["install"]);
      npmOut = npm.out;
      if (npm.code !== 0) {
        return Response.json({
          ok: false,
          reason: "npm_failed",
          message: "git pull OK, ale npm install zlyhal:\n" + npmOut,
          commit: await git(["rev-parse", "--short", "HEAD"]),
        }, { status: 500 });
      }
    }

    const needsElectronRestart = changedFiles.some((f) => f.startsWith("electron/"));
    const needsDevRestart = needsNpm || changedFiles.includes("next.config.ts");
    const newCommit = await git(["rev-parse", "--short", "HEAD"]);

    return Response.json({
      ok: true,
      updated: true,
      commitsAhead: behind,
      commit: newCommit,
      incoming: incoming.split("\n").slice(0, 20),
      changedFiles: changedFiles.slice(0, 50),
      needsElectronRestart,
      needsDevRestart,
      npmRan: needsNpm && runNpmInstall,
      npmOutput: npmOut.slice(-500),
      message: needsElectronRestart || needsDevRestart
        ? "Aktualizácia úspešná. Reštartuj appku (Cmd+Q a znova `npm run electron:dev`)."
        : "Aktualizácia úspešná. Stránka sa automaticky reloadne.",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ ok: false, reason: "exception", message: msg }, { status: 500 });
  }
}
