import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { Note, NoteDetail, Section, SectionImage, TranscriptSegment, NoteStats } from "./types";
import { getDbPath } from "./paths";

const DB_PATH = getDbPath();

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!_db) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
    initSchema(_db);
  }
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      source TEXT NOT NULL,
      url TEXT,
      original_path TEXT,
      status TEXT NOT NULL DEFAULT 'queued',
      language TEXT,
      duration TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      summary TEXT,
      tags TEXT,
      progress INTEGER DEFAULT 0,
      current_step TEXT,
      error_msg TEXT,
      whisper_model TEXT DEFAULT 'base',
      frame_interval REAL DEFAULT 3.0,
      hash_threshold INTEGER DEFAULT 8,
      skip_classify INTEGER DEFAULT 0,
      output_dir TEXT,
      html_path TEXT,
      notes_json TEXT,
      output_language TEXT,
      published INTEGER DEFAULT 0,
      published_at TEXT
    );

    CREATE TABLE IF NOT EXISTS sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
      position INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      takeaways TEXT
    );

    CREATE TABLE IF NOT EXISTS section_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      section_id INTEGER NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
      position INTEGER NOT NULL,
      file_path TEXT NOT NULL,
      caption TEXT
    );

    CREATE TABLE IF NOT EXISTS transcript_segments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
      start_time REAL NOT NULL,
      end_time REAL NOT NULL,
      text TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_notes_status ON notes(status);
    CREATE INDEX IF NOT EXISTS idx_notes_created ON notes(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_sections_note ON sections(note_id);
    CREATE INDEX IF NOT EXISTS idx_transcript_note ON transcript_segments(note_id);
  `);

  try { db.exec(`ALTER TABLE notes ADD COLUMN published INTEGER DEFAULT 0`); } catch { /* exists */ }
  try { db.exec(`ALTER TABLE notes ADD COLUMN published_at TEXT`); } catch { /* exists */ }
  try { db.exec(`ALTER TABLE notes ADD COLUMN output_language TEXT`); } catch { /* exists */ }

  db.exec(`CREATE INDEX IF NOT EXISTS idx_notes_published ON notes(published);`);
}

// ─── Row → Type helpers ─────────────────────────────────────────────────────

function rowToNote(row: Record<string, unknown>): Note {
  return {
    id: row.id as string,
    title: row.title as string,
    source: row.source as "youtube" | "local",
    url: row.url as string | null,
    original_path: row.original_path as string | null,
    status: row.status as Note["status"],
    language: row.language as string | null,
    duration: row.duration as string | null,
    created_at: row.created_at as string,
    summary: row.summary as string | null,
    tags: row.tags ? JSON.parse(row.tags as string) : [],
    progress: (row.progress as number) || 0,
    current_step: row.current_step as string | null,
    error_msg: row.error_msg as string | null,
    whisper_model: (row.whisper_model as string) || "base",
    frame_interval: (row.frame_interval as number) || 3.0,
    hash_threshold: (row.hash_threshold as number) || 8,
    skip_classify: !!(row.skip_classify as number),
    output_dir: row.output_dir as string | null,
    html_path: row.html_path as string | null,
    published: !!(row.published as number),
    published_at: row.published_at as string | null,
  };
}

// ─── Notes CRUD ─────────────────────────────────────────────────────────────

export function createNote(params: {
  id: string;
  title: string;
  source: "youtube" | "local";
  url?: string | null;
  original_path?: string | null;
  whisper_model?: string;
  frame_interval?: number;
  hash_threshold?: number;
  skip_classify?: boolean;
  output_language?: string;
}): Note {
  const db = getDb();
  db.prepare(`
    INSERT INTO notes (id, title, source, url, original_path, whisper_model, frame_interval, hash_threshold, skip_classify, output_language)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    params.id,
    params.title,
    params.source,
    params.url ?? null,
    params.original_path ?? null,
    params.whisper_model ?? "base",
    params.frame_interval ?? 3.0,
    params.hash_threshold ?? 8,
    params.skip_classify ? 1 : 0,
    params.output_language ?? null
  );
  return getNoteById(params.id)!;
}

export function getNotes(filters?: {
  status?: string;
  search?: string;
}): Note[] {
  const db = getDb();
  let sql = "SELECT * FROM notes";
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters?.status) {
    const statuses = filters.status.split(",");
    conditions.push(`status IN (${statuses.map(() => "?").join(",")})`);
    params.push(...statuses);
  }
  if (filters?.search) {
    conditions.push("title LIKE ?");
    params.push(`%${filters.search}%`);
  }
  if (conditions.length > 0) {
    sql += " WHERE " + conditions.join(" AND ");
  }
  sql += " ORDER BY created_at DESC";

  return db.prepare(sql).all(...params).map((row) => rowToNote(row as Record<string, unknown>));
}

export function getPublishedNotes(search?: string): Note[] {
  const db = getDb();
  let sql = "SELECT * FROM notes WHERE published = 1 AND status = 'done'";
  const params: unknown[] = [];
  if (search) {
    sql += " AND (title LIKE ? OR summary LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }
  sql += " ORDER BY published_at DESC";
  return db.prepare(sql).all(...params).map((row) => rowToNote(row as Record<string, unknown>));
}

export function publishNote(id: string): void {
  const db = getDb();
  db.prepare("UPDATE notes SET published = 1, published_at = datetime('now') WHERE id = ?").run(id);
}

export function unpublishNote(id: string): void {
  const db = getDb();
  db.prepare("UPDATE notes SET published = 0, published_at = NULL WHERE id = ?").run(id);
}

export function getNoteById(id: string): Note | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM notes WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  return row ? rowToNote(row) : null;
}

export function getNoteDetail(id: string): NoteDetail | null {
  const note = getNoteById(id);
  if (!note) return null;

  const db = getDb();

  const sectionRows = db.prepare(
    "SELECT * FROM sections WHERE note_id = ? ORDER BY position"
  ).all(id) as Record<string, unknown>[];

  const sections: Section[] = sectionRows.map((row) => {
    const imageRows = db.prepare(
      "SELECT * FROM section_images WHERE section_id = ? ORDER BY position"
    ).all(row.id as number) as Record<string, unknown>[];

    return {
      id: row.id as number,
      note_id: row.note_id as string,
      position: row.position as number,
      title: row.title as string,
      content: row.content as string,
      takeaways: row.takeaways ? JSON.parse(row.takeaways as string) : [],
      images: imageRows.map((img) => ({
        id: img.id as number,
        section_id: img.section_id as number,
        position: img.position as number,
        file_path: img.file_path as string,
        caption: img.caption as string | null,
      })),
    };
  });

  const transcriptRows = db.prepare(
    "SELECT * FROM transcript_segments WHERE note_id = ? ORDER BY start_time"
  ).all(id) as Record<string, unknown>[];

  const transcript: TranscriptSegment[] = transcriptRows.map((row) => ({
    id: row.id as number,
    note_id: row.note_id as string,
    start_time: row.start_time as number,
    end_time: row.end_time as number,
    text: row.text as string,
  }));

  return { ...note, sections, transcript };
}

export function updateNote(id: string, fields: Partial<Record<string, unknown>>): void {
  const db = getDb();
  const keys = Object.keys(fields);
  if (keys.length === 0) return;
  const sql = `UPDATE notes SET ${keys.map((k) => `${k} = ?`).join(", ")} WHERE id = ?`;
  db.prepare(sql).run(...keys.map((k) => fields[k]), id);
}

export function deleteNote(id: string): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM notes WHERE id = ?").run(id);
  return result.changes > 0;
}

// ─── Sections ───────────────────────────────────────────────────────────────

export function insertSections(
  noteId: string,
  sections: { title: string; content: string; takeaways?: string[]; images?: { file_path: string; caption?: string }[] }[]
): void {
  const db = getDb();
  const insertSection = db.prepare(
    "INSERT INTO sections (note_id, position, title, content, takeaways) VALUES (?, ?, ?, ?, ?)"
  );
  const insertImage = db.prepare(
    "INSERT INTO section_images (section_id, position, file_path, caption) VALUES (?, ?, ?, ?)"
  );

  const transaction = db.transaction(() => {
    for (let i = 0; i < sections.length; i++) {
      const sec = sections[i];
      const result = insertSection.run(
        noteId,
        i,
        sec.title,
        sec.content,
        sec.takeaways ? JSON.stringify(sec.takeaways) : null
      );
      const sectionId = result.lastInsertRowid;

      if (sec.images) {
        for (let j = 0; j < sec.images.length; j++) {
          insertImage.run(sectionId, j, sec.images[j].file_path, sec.images[j].caption ?? null);
        }
      }
    }
  });
  transaction();
}

// ─── Transcript ─────────────────────────────────────────────────────────────

export function insertTranscript(
  noteId: string,
  segments: { start_time: number; end_time: number; text: string }[]
): void {
  const db = getDb();
  const insert = db.prepare(
    "INSERT INTO transcript_segments (note_id, start_time, end_time, text) VALUES (?, ?, ?, ?)"
  );
  const transaction = db.transaction(() => {
    for (const seg of segments) {
      insert.run(noteId, seg.start_time, seg.end_time, seg.text);
    }
  });
  transaction();
}

// ─── Stats ──────────────────────────────────────────────────────────────────

export function getStats(): NoteStats {
  const db = getDb();
  const row = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as done,
      SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
      SUM(CASE WHEN status = 'queued' THEN 1 ELSE 0 END) as queued
    FROM notes
  `).get() as Record<string, number>;

  const sectionCount = db.prepare("SELECT COUNT(*) as c FROM sections").get() as { c: number };
  const imageCount = db.prepare("SELECT COUNT(*) as c FROM section_images").get() as { c: number };

  return {
    total: row.total || 0,
    done: row.done || 0,
    processing: row.processing || 0,
    queued: row.queued || 0,
    totalSections: sectionCount.c || 0,
    totalImages: imageCount.c || 0,
  };
}

// ─── Settings ───────────────────────────────────────────────────────────────

export function getSetting(key: string): string | null {
  const db = getDb();
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

export function setSetting(key: string, value: string): void {
  const db = getDb();
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(key, value);
}

export function getAllSettings(): Record<string, string> {
  const db = getDb();
  const rows = db.prepare("SELECT key, value FROM settings").all() as { key: string; value: string }[];
  const result: Record<string, string> = {};
  for (const row of rows) {
    result[row.key] = row.value;
  }
  return result;
}
