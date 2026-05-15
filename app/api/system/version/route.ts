import { execFile } from "child_process";
import { promisify } from "util";

const exec = promisify(execFile);

export const runtime = "nodejs";

async function git(args: string[]): Promise<string> {
  const { stdout } = await exec("git", args, { cwd: process.cwd() });
  return stdout.trim();
}

export async function GET() {
  try {
    const [commit, branch, subject, date] = await Promise.all([
      git(["rev-parse", "--short", "HEAD"]),
      git(["rev-parse", "--abbrev-ref", "HEAD"]),
      git(["log", "-1", "--pretty=%s"]),
      git(["log", "-1", "--pretty=%cd", "--date=iso"]),
    ]);
    return Response.json({ commit, branch, subject, date });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: msg }, { status: 500 });
  }
}
