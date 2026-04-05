@AGENTS.md

# Wander Video Noter

Video → Structured Notes pipeline pre Túlavé kino. Next.js 16 App Router + SQLite + Python backend.

## Tech Stack

- **Frontend:** Next.js 16 (App Router, TypeScript), SWR for data fetching, inline styles with MD3 CSS variables
- **Backend:** Next.js API routes (`app/api/`) bridging to Python subprocess
- **Database:** SQLite via `better-sqlite3` (`data/wander.db`, auto-created)
- **Pipeline:** Python script (`python/video_notes.py`) — Whisper, FFmpeg, imagehash, Claude Vision API

## Project Structure

- `app/(app)/` — all pages (dashboard, new, library, queue, notes/[id], settings) share a layout with Sidebar
- `app/api/` — REST endpoints: `/api/notes` (CRUD), `/api/notes/[id]/status` (polling), `/api/settings`
- `components/` — shared UI: Icon, Sidebar, StatusBadge, StatCard, NoteRow, PipelineSteps
- `lib/db.ts` — SQLite schema init + all queries (createNote, getNotes, getNoteDetail, insertSections, insertTranscript, etc.)
- `lib/pipeline.ts` — spawns `python3 python/video_notes.py` as subprocess, polls `.progress.json`, reads `result.json` on completion
- `lib/types.ts` — TypeScript interfaces (Note, NoteDetail, Section, SectionImage, TranscriptSegment, NoteStats)
- `python/video_notes.py` — CLI pipeline with `--json-progress <file>` and `--json-output` flags for Next.js integration
- `app/providers.tsx` — ThemeProvider (dark/light) via React Context
- `app/globals.css` — MD3 design tokens, both themes, animations

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
```

## Key Patterns

- All pages are `"use client"` components using `useSWR` for data fetching
- Pipeline runs async: POST `/api/notes` returns immediately, frontend polls `/api/notes/[id]/status` every 3s
- Images served from `public/notes/{noteId}/images/` (auto-created by pipeline)
- Theme toggle via `data-theme` attribute on root div, CSS variables switch between dark/light
- Python pipeline writes progress to `.progress.json` file, result to `result.json` — Next.js reads these files
- `generate_notes()` in Python returns a tuple `(html_path, notes_dict)` — the notes dict is used for `result.json`

## Database

SQLite with tables: `notes`, `sections`, `section_images`, `transcript_segments`, `settings`. Schema auto-created on first access. `data/` is gitignored.

## Environment

```bash
ANTHROPIC_API_KEY=sk-ant-...   # Can also be set via Settings page → stored in DB
```

## Python Dependencies

```bash
pip install openai-whisper yt-dlp Pillow imagehash anthropic
# Also requires: ffmpeg (system)
```
