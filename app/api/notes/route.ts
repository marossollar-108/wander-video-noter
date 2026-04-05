import { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { createNote, getNotes, getStats } from "@/lib/db";

const YOUTUBE_RE = /(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status") ?? undefined;
    const search = searchParams.get("search") ?? undefined;

    const notes = getNotes({ status, search });
    const stats = getStats();

    return Response.json({ notes, stats });
  } catch (err) {
    console.error("GET /api/notes error:", err);
    return Response.json(
      { error: "Failed to fetch notes" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      url,
      filePath,
      whisperModel,
      frameInterval,
      hashThreshold,
      skipClassify,
    } = body as {
      url?: string;
      filePath?: string;
      whisperModel?: string;
      frameInterval?: number;
      hashThreshold?: number;
      skipClassify?: boolean;
    };

    if (!url && !filePath) {
      return Response.json(
        { error: "Either url or filePath is required" },
        { status: 400 }
      );
    }

    const isYoutube = url ? YOUTUBE_RE.test(url) : false;
    const source = isYoutube ? "youtube" : "local";

    let title: string;
    if (url) {
      // Use the URL as-is for the title; strip protocol for readability
      title = url.replace(/^https?:\/\//, "").slice(0, 120);
    } else {
      title = path.basename(filePath!, path.extname(filePath!));
    }

    const id = uuidv4();

    const note = createNote({
      id,
      title,
      source,
      url: url ?? null,
      original_path: filePath ?? null,
      whisper_model: whisperModel,
      frame_interval: frameInterval,
      hash_threshold: hashThreshold,
      skip_classify: skipClassify,
    });

    // Fire-and-forget pipeline start
    try {
      const { startPipeline } = await import("@/lib/pipeline");
      startPipeline(note.id);
    } catch (pipelineErr) {
      console.warn("Pipeline module not available yet:", pipelineErr);
    }

    return Response.json({ note }, { status: 201 });
  } catch (err) {
    console.error("POST /api/notes error:", err);
    return Response.json(
      { error: "Failed to create note" },
      { status: 500 }
    );
  }
}
