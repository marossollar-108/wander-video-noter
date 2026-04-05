import { spawn, ChildProcess } from "child_process";
import path from "path";
import fs from "fs";
import * as db from "./db";

const runningProcesses = new Map<string, ChildProcess>();

interface ProgressData {
  step: string;
  step_index: number;
  total_steps: number;
  progress: number;
  message: string;
}

interface ResultJson {
  title: string;
  language: string;
  duration_seconds: number;
  summary: string;
  sections: {
    title: string;
    content: string;
    images: { file: string; caption: string }[];
    key_takeaways: string[];
  }[];
  transcript_segments: { start: number; end: number; text: string }[];
  frame_count: number;
  tags: string[];
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function startPipeline(noteId: string): void {
  const note = db.getNoteById(noteId);
  if (!note) {
    throw new Error(`Note not found: ${noteId}`);
  }

  // Create output directory
  const outputDir = path.join(process.cwd(), "public", "notes", noteId);
  fs.mkdirSync(outputDir, { recursive: true });

  const progressFile = path.join(outputDir, ".progress.json");

  // Update note status to processing
  db.updateNote(noteId, {
    status: "processing",
    progress: 0,
    current_step: "download",
  });

  // Get API key from settings or environment
  const apiKey = db.getSetting("anthropic_api_key") || process.env.ANTHROPIC_API_KEY || "";

  // Determine source: URL for youtube, original_path for local
  const source = note.source === "youtube" ? note.url : note.original_path;
  if (!source) {
    db.updateNote(noteId, {
      status: "error",
      error_msg: "No source URL or file path provided",
    });
    return;
  }

  // Build command arguments
  const args: string[] = [
    path.join(process.cwd(), "python", "video_notes.py"),
    source,
    "--output", outputDir,
    "--whisper-model", note.whisper_model,
    "--frame-interval", String(note.frame_interval),
    "--hash-threshold", String(note.hash_threshold),
    "--json-progress", progressFile,
    "--json-output",
  ];

  if (note.skip_classify) {
    args.push("--skip-classification");
  }

  // Spawn the Python process
  const env = { ...process.env, KMP_DUPLICATE_LIB_OK: "TRUE", ANTHROPIC_API_KEY: apiKey || process.env.ANTHROPIC_API_KEY || "" };

  const proc = spawn("python3", args, {
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  runningProcesses.set(noteId, proc);

  // Collect stderr for error reporting
  let stderrChunks: Buffer[] = [];
  proc.stderr?.on("data", (chunk: Buffer) => {
    stderrChunks.push(chunk);
  });

  // Poll progress file every 2 seconds
  const pollInterval = setInterval(() => {
    try {
      if (fs.existsSync(progressFile)) {
        const raw = fs.readFileSync(progressFile, "utf-8");
        const progress: ProgressData = JSON.parse(raw);
        db.updateNote(noteId, {
          progress: progress.progress,
          current_step: progress.step,
        });
      }
    } catch {
      // File may be partially written; ignore read errors
    }
  }, 2000);

  proc.on("exit", (code) => {
    clearInterval(pollInterval);
    runningProcesses.delete(noteId);

    if (code === 0) {
      try {
        // Read result.json
        const resultPath = path.join(outputDir, "result.json");
        const resultRaw = fs.readFileSync(resultPath, "utf-8");
        const result: ResultJson = JSON.parse(resultRaw);

        const duration = formatDuration(result.duration_seconds);

        // Insert sections into DB
        const sectionsData = result.sections.map((sec) => ({
          title: sec.title,
          content: sec.content,
          takeaways: sec.key_takeaways,
          images: sec.images.map((img) => ({
            file_path: img.file,
            caption: img.caption,
          })),
        }));
        db.insertSections(noteId, sectionsData);

        // Insert transcript segments into DB
        const transcriptData = result.transcript_segments.map((seg) => ({
          start_time: seg.start,
          end_time: seg.end,
          text: seg.text,
        }));
        db.insertTranscript(noteId, transcriptData);

        // Update note as done
        const htmlPath = path.join(outputDir, "notes.html");
        db.updateNote(noteId, {
          status: "done",
          progress: 100,
          current_step: null,
          summary: result.summary,
          language: result.language,
          duration: duration,
          tags: JSON.stringify(result.tags),
          output_dir: outputDir,
          html_path: htmlPath,
        });

        // Clean up uploaded local video file after processing
        if (note.source === "local" && note.original_path) {
          try {
            const uploadsDir = path.join(process.cwd(), "uploads");
            if (note.original_path.startsWith(uploadsDir)) {
              fs.unlinkSync(note.original_path);
            }
          } catch { /* ignore cleanup errors */ }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        db.updateNote(noteId, {
          status: "error",
          error_msg: `Pipeline finished but failed to process results: ${msg}`,
        });
      }
    } else {
      const stderr = Buffer.concat(stderrChunks).toString("utf-8").trim();
      db.updateNote(noteId, {
        status: "error",
        error_msg: stderr || `Process exited with code ${code}`,
      });
    }
  });

  proc.on("error", (err) => {
    clearInterval(pollInterval);
    runningProcesses.delete(noteId);
    db.updateNote(noteId, {
      status: "error",
      error_msg: `Failed to spawn process: ${err.message}`,
    });
  });
}

export function killPipeline(noteId: string): boolean {
  const proc = runningProcesses.get(noteId);
  if (proc) {
    proc.kill();
    runningProcesses.delete(noteId);
    return true;
  }
  return false;
}
