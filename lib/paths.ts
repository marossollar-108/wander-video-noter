import path from "path";
import fs from "fs";

const dataDir = process.env.WANDER_DATA_DIR || process.cwd();

export function getDataDir(): string {
  return dataDir;
}

export function getDbPath(): string {
  return path.join(dataDir, "data", "wander.db");
}

export function getNotesDir(): string {
  return path.join(dataDir, "notes");
}

export function getNoteDir(noteId: string): string {
  return path.join(getNotesDir(), noteId);
}

export function getUploadsDir(): string {
  return path.join(dataDir, "uploads");
}

export function getVenvDir(): string {
  return path.join(dataDir, "venv");
}

export function getVenvPython(): string {
  return path.join(getVenvDir(), "bin", "python3");
}

export function getVenvBin(): string {
  return path.join(getVenvDir(), "bin");
}

export function getPipelineScript(): string {
  const bundled = process.env.WANDER_PIPELINE_SCRIPT;
  if (bundled && fs.existsSync(bundled)) return bundled;
  return path.join(process.cwd(), "python", "video_notes.py");
}
