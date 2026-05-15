import { NextRequest } from "next/server";
import { spawn } from "child_process";
import { mkdir } from "fs/promises";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { getUploadsDir, getVenvBin } from "@/lib/paths";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { url } = (await request.json()) as { url?: string };
    if (!url) {
      return Response.json({ error: "URL is required" }, { status: 400 });
    }

    const uploadsDir = getUploadsDir();
    await mkdir(uploadsDir, { recursive: true });

    const filename = `${uuidv4()}.mp4`;
    const filePath = path.join(uploadsDir, filename);

    // Try downloading with yt-dlp
    const result = await new Promise<{ success: boolean; title: string; error?: string }>((resolve) => {
      const currentPath = process.env.PATH || "";
      const args = [
        "-f", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
        "--merge-output-format", "mp4",
        "-o", filePath,
        "--no-playlist",
        "--print", "%(title)s",
        "--no-simulate",
        url,
      ];

      const userDataVenvBin = getVenvBin();
      const projectVenvBin = path.join(process.cwd(), ".venv", "bin");
      const venvBin = fs.existsSync(userDataVenvBin) ? userDataVenvBin
        : fs.existsSync(projectVenvBin) ? projectVenvBin : "";
      const pathPrefix = [venvBin, "/opt/homebrew/bin", "/usr/local/bin"].filter(Boolean).join(":");
      const proc = spawn("yt-dlp", args, {
        env: { ...process.env, PATH: `${pathPrefix}:${currentPath}` },
        stdio: ["ignore", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";

      proc.stdout?.on("data", (chunk: Buffer) => { stdout += chunk.toString(); });
      proc.stderr?.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });

      proc.on("exit", (code) => {
        if (code === 0) {
          // First line of stdout is the title (from --print)
          const title = stdout.trim().split("\n")[0] || "YouTube Video";
          resolve({ success: true, title });
        } else {
          resolve({ success: false, title: "", error: stderr.trim() });
        }
      });

      proc.on("error", (err) => {
        resolve({ success: false, title: "", error: err.message });
      });

      // Timeout after 5 minutes
      setTimeout(() => {
        proc.kill();
        resolve({ success: false, title: "", error: "Download timed out" });
      }, 300000);
    });

    if (!result.success) {
      const isBot = result.error?.includes("Sign in to confirm") || result.error?.includes("bot");
      return Response.json({
        error: isBot
          ? "YouTube blokuje stahovanie z tohto servera. Stiahnite video manualne a nahrajte ho cez 'Lokalny subor'."
          : result.error || "Download failed",
        isBot,
      }, { status: 422 });
    }

    return Response.json({
      filePath,
      title: result.title,
      fileName: `${result.title}.mp4`,
    });
  } catch (err) {
    console.error("YouTube download error:", err);
    return Response.json({ error: "Download failed" }, { status: 500 });
  }
}
