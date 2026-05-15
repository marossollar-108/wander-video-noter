# Wander Video Noter

Lokálna desktop appka (Electron + Next.js + Python) pre prevod videí na štruktúrované poznámky cez Whisper + Claude Vision.

## Prvé spustenie (jednorazové)

```bash
# 1. System binárky
brew install python3 ffmpeg

# 2. Python venv + pipeline deps
python3 -m venv .venv
.venv/bin/pip install faster-whisper yt-dlp Pillow imagehash anthropic

# 3. Node deps
npm install
```

Pipeline si automaticky spustí `.venv/bin/python3`, ak `.venv/` v projekte existuje (fallback: systémový `python3`).

API kľúč (ANTHROPIC_API_KEY) nastav v Settings stránke v appke, alebo do `.env`.

## Spustenie ako Electron desktop appka

```bash
npm run electron:dev
```

Spustí súčasne `next dev` (port 3000) + Electron okno ktoré ho zobrazuje. Všetky výpočty (Whisper transcription, FFmpeg, image hashing) bežia lokálne — využijú CPU/RAM tvojho Macu, nie server.

## Iba web (bez Electron okna)

```bash
npm run dev   # http://localhost:3000
```

## Build pre produkciu (cloud server)

```bash
npm run build && npm run start
```

## Tech Stack

- **Frontend:** Next.js 16 (App Router) + React 19 + SWR
- **Backend:** Next.js API routes
- **DB:** SQLite (`data/wander.db`)
- **Pipeline:** Python subprocess — Whisper, FFmpeg, imagehash, Claude Vision
- **Desktop shell:** Electron 42

## Štruktúra

- `app/(app)/` — stránky (dashboard, new, library, queue, notes/[id], settings)
- `app/api/` — REST endpointy
- `electron/main.js` — Electron main process
- `lib/pipeline.ts` — spawne `python3 python/video_notes.py`
- `python/video_notes.py` — CLI pipeline
- `data/` — SQLite DB (gitignored)
- `public/notes/<id>/` — výstupy (HTML, obrázky)
- `uploads/` — dočasné video súbory (gitignored)
