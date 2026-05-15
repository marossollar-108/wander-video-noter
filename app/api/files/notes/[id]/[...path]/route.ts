import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import { getNoteDir } from "@/lib/paths";

export const runtime = "nodejs";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".html": "text/html; charset=utf-8",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
};

type RouteContext = { params: Promise<{ id: string; path: string[] }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id, path: parts } = await context.params;

  const noteDir = path.resolve(getNoteDir(id));
  const filePath = path.resolve(noteDir, ...parts);

  // Guard against path traversal — resolved path must be inside the note's dir
  if (!filePath.startsWith(noteDir + path.sep)) {
    return new Response("Forbidden", { status: 403 });
  }

  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return new Response("Not found", { status: 404 });
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME[ext] || "application/octet-stream";
  const data = fs.readFileSync(filePath);
  return new Response(data, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
