#!/usr/bin/env python3
"""
Video → Structured Notes Generator
===================================
Takes a YouTube URL or local video file and produces a beautiful HTML page
with transcription, summarization, and intelligently captured presentation visuals.

Pipeline:
  1. Download video (if YouTube)
  2. Extract audio → transcribe with Whisper (auto-detect language)
  3. Extract frames at intervals via FFmpeg
  4. Deduplicate frames (perceptual hashing — keeps only scene changes)
  5. Classify frames via Claude Vision (slide/diagram vs. presenter/irrelevant)
  6. Match relevant frames to transcript segments by timestamp
  7. Generate structured HTML notes via Claude

Requirements:
  pip install openai-whisper yt-dlp Pillow imagehash anthropic

System dependencies:
  - ffmpeg (apt install ffmpeg / brew install ffmpeg)

Usage:
  # YouTube video
  python video_notes.py "https://www.youtube.com/watch?v=XXXXX"

  # Local file
  python video_notes.py presentation.mp4

  # With options
  python video_notes.py video.mp4 --whisper-model medium --frame-interval 2 --output notes.html

Environment:
  ANTHROPIC_API_KEY=sk-ant-...   (required for frame classification & note generation)
"""

import argparse
import base64
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Optional

# ---------------------------------------------------------------------------
# Lazy imports — we check availability and give clear install instructions
# ---------------------------------------------------------------------------

def _check_deps():
    missing = []
    try:
        import whisper  # noqa: F401
    except ImportError:
        missing.append("openai-whisper")
    try:
        import yt_dlp  # noqa: F401
    except ImportError:
        missing.append("yt-dlp")
    try:
        from PIL import Image  # noqa: F401
    except ImportError:
        missing.append("Pillow")
    try:
        import imagehash  # noqa: F401
    except ImportError:
        missing.append("imagehash")
    try:
        import anthropic  # noqa: F401
    except ImportError:
        missing.append("anthropic")
    if missing:
        print(f"❌ Missing packages: {', '.join(missing)}")
        print(f"   pip install {' '.join(missing)}")
        sys.exit(1)
    # Check ffmpeg
    if not shutil.which("ffmpeg"):
        print("❌ ffmpeg not found. Install it:")
        print("   Ubuntu/Debian: sudo apt install ffmpeg")
        print("   macOS:         brew install ffmpeg")
        sys.exit(1)

# ═══════════════════════════════════════════════════════════════════════════
# STEP 1: Video acquisition
# ═══════════════════════════════════════════════════════════════════════════

def download_youtube(url: str, output_dir: str) -> str:
    """Download YouTube video, return path to the downloaded file."""
    import yt_dlp
    print(f"⬇️  Downloading: {url}")
    outtmpl = os.path.join(output_dir, "video.%(ext)s")
    ydl_opts = {
        "format": "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
        "outtmpl": outtmpl,
        "merge_output_format": "mp4",
        "quiet": True,
        "no_warnings": True,
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        title = info.get("title", "video")
        print(f"   Title: {title}")
    # Find the downloaded file
    for f in os.listdir(output_dir):
        if f.startswith("video."):
            return os.path.join(output_dir, f), title
    raise FileNotFoundError("Download failed — no video file found")


def get_video(source: str, work_dir: str) -> tuple[str, str]:
    """
    Returns (video_path, title).
    Handles YouTube URLs and local files.
    """
    yt_pattern = re.compile(
        r"(https?://)?(www\.)?(youtube\.com|youtu\.be)/"
    )
    if yt_pattern.match(source):
        return download_youtube(source, work_dir)
    else:
        path = os.path.abspath(source)
        if not os.path.isfile(path):
            print(f"❌ File not found: {path}")
            sys.exit(1)
        title = Path(path).stem
        return path, title


# ═══════════════════════════════════════════════════════════════════════════
# STEP 2: Audio extraction & transcription
# ═══════════════════════════════════════════════════════════════════════════

def extract_audio(video_path: str, work_dir: str) -> str:
    """Extract audio track as WAV (16kHz mono — optimal for Whisper)."""
    audio_path = os.path.join(work_dir, "audio.wav")
    print("🔊 Extracting audio...")
    subprocess.run(
        [
            "ffmpeg", "-i", video_path,
            "-vn",                    # no video
            "-acodec", "pcm_s16le",   # 16-bit PCM
            "-ar", "16000",           # 16kHz
            "-ac", "1",               # mono
            "-y",                     # overwrite
            audio_path,
        ],
        capture_output=True,
        check=True,
    )
    return audio_path


def transcribe(audio_path: str, model_name: str = "base") -> dict:
    """
    Transcribe audio with Whisper. Returns dict with:
      - language: detected language
      - segments: list of {start, end, text}
      - full_text: concatenated transcript
    """
    import whisper
    print(f"🎤 Transcribing with Whisper ({model_name})...")
    model = whisper.load_model(model_name)
    result = model.transcribe(audio_path, verbose=False)
    language = result.get("language", "unknown")
    print(f"   Detected language: {language}")
    segments = [
        {"start": seg["start"], "end": seg["end"], "text": seg["text"].strip()}
        for seg in result["segments"]
    ]
    full_text = " ".join(s["text"] for s in segments)
    print(f"   Segments: {len(segments)}, Total chars: {len(full_text)}")
    return {"language": language, "segments": segments, "full_text": full_text}


# ═══════════════════════════════════════════════════════════════════════════
# STEP 3: Frame extraction
# ═══════════════════════════════════════════════════════════════════════════

def extract_frames(video_path: str, work_dir: str, interval: float = 3.0) -> list[dict]:
    """
    Extract one frame every `interval` seconds.
    Returns list of {path, timestamp_sec}.
    """
    frames_dir = os.path.join(work_dir, "frames")
    os.makedirs(frames_dir, exist_ok=True)
    print(f"🎞️  Extracting frames every {interval}s...")
    subprocess.run(
        [
            "ffmpeg", "-i", video_path,
            "-vf", f"fps=1/{interval}",
            "-qscale:v", "2",         # high quality JPEG
            "-y",
            os.path.join(frames_dir, "frame_%05d.jpg"),
        ],
        capture_output=True,
        check=True,
    )
    frames = []
    for fname in sorted(os.listdir(frames_dir)):
        if not fname.endswith(".jpg"):
            continue
        idx = int(fname.replace("frame_", "").replace(".jpg", "")) - 1
        frames.append({
            "path": os.path.join(frames_dir, fname),
            "timestamp": idx * interval,
        })
    print(f"   Extracted {len(frames)} frames")
    return frames


# ═══════════════════════════════════════════════════════════════════════════
# STEP 4: Frame deduplication (perceptual hash)
# ═══════════════════════════════════════════════════════════════════════════

def deduplicate_frames(frames: list[dict], threshold: int = 8) -> list[dict]:
    """
    Remove near-duplicate frames using perceptual hashing.
    `threshold` = max Hamming distance to consider frames identical.
    Lower = stricter (more frames kept). Default 8 is good for slides.
    """
    import imagehash
    from PIL import Image

    print(f"🔍 Deduplicating frames (threshold={threshold})...")
    if not frames:
        return []

    kept = [frames[0]]
    prev_hash = imagehash.phash(Image.open(frames[0]["path"]))

    for frame in frames[1:]:
        curr_hash = imagehash.phash(Image.open(frame["path"]))
        distance = curr_hash - prev_hash
        if distance > threshold:
            kept.append(frame)
            prev_hash = curr_hash

    print(f"   {len(frames)} → {len(kept)} unique frames")
    return kept


# ═══════════════════════════════════════════════════════════════════════════
# STEP 5: Frame classification via Claude Vision
# ═══════════════════════════════════════════════════════════════════════════

def _encode_image(path: str, max_size: int = 1024) -> str:
    """Resize + base64-encode an image for the Claude API."""
    from PIL import Image
    img = Image.open(path)
    img.thumbnail((max_size, max_size))
    from io import BytesIO
    buf = BytesIO()
    img.save(buf, format="JPEG", quality=85)
    return base64.b64encode(buf.getvalue()).decode()


def classify_frames(frames: list[dict], batch_size: int = 5) -> list[dict]:
    """
    Send frames to Claude Vision in batches.
    Each frame gets a label: 'slide', 'diagram', 'code', 'table', or 'skip'.
    Returns only the useful frames.
    """
    import anthropic
    client = anthropic.Anthropic()
    useful = []
    total = len(frames)

    print(f"🤖 Classifying {total} frames via Claude Vision...")

    for i in range(0, total, batch_size):
        batch = frames[i : i + batch_size]
        content = []
        for j, frame in enumerate(batch):
            b64 = _encode_image(frame["path"])
            content.append({
                "type": "image",
                "source": {"type": "base64", "media_type": "image/jpeg", "data": b64},
            })
            content.append({
                "type": "text",
                "text": f"Image {j+1} (timestamp: {frame['timestamp']:.1f}s)",
            })

        content.append({
            "type": "text",
            "text": (
                "For each image above, respond with ONLY a JSON array. "
                "Each element: {\"index\": <1-based>, \"label\": \"<label>\", \"description\": \"<brief>\"}\n"
                "Labels: 'slide' (presentation slide), 'diagram' (chart/graph/diagram), "
                "'code' (code snippet), 'table' (data table), 'skip' (presenter face, "
                "audience, transition, blurry, or not useful).\n"
                "Return ONLY the JSON array, no markdown fences."
            ),
        })

        try:
            resp = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=1024,
                messages=[{"role": "user", "content": content}],
            )
            text = resp.content[0].text.strip()
            # Strip markdown fences if present
            text = re.sub(r"^```(?:json)?\s*", "", text)
            text = re.sub(r"\s*```$", "", text)
            classifications = json.loads(text)

            for cls in classifications:
                idx = cls["index"] - 1
                if idx < len(batch) and cls["label"] != "skip":
                    frame_data = batch[idx].copy()
                    frame_data["label"] = cls["label"]
                    frame_data["description"] = cls.get("description", "")
                    useful.append(frame_data)
        except Exception as e:
            print(f"   ⚠️  Batch {i//batch_size + 1} classification error: {e}")
            # On error, keep all frames in batch as 'slide' (safe fallback)
            for frame in batch:
                frame_data = frame.copy()
                frame_data["label"] = "slide"
                frame_data["description"] = ""
                useful.append(frame_data)

        done = min(i + batch_size, total)
        print(f"   Classified {done}/{total}")

    print(f"   ✅ Kept {len(useful)} useful frames")
    return useful


# ═══════════════════════════════════════════════════════════════════════════
# STEP 6: Match frames to transcript segments
# ═══════════════════════════════════════════════════════════════════════════

def match_frames_to_segments(
    frames: list[dict], segments: list[dict], window: float = 15.0
) -> list[dict]:
    """
    For each frame, find the transcript segments within ±window seconds
    and attach them. Returns enriched frame list.
    """
    for frame in frames:
        ts = frame["timestamp"]
        nearby = [
            seg for seg in segments
            if seg["start"] - window <= ts <= seg["end"] + window
        ]
        frame["transcript_context"] = " ".join(s["text"] for s in nearby)
    return frames


# ═══════════════════════════════════════════════════════════════════════════
# STEP 7: Generate structured HTML via Claude
# ═══════════════════════════════════════════════════════════════════════════

def _format_timestamp(seconds: float) -> str:
    m, s = divmod(int(seconds), 60)
    h, m = divmod(m, 60)
    if h:
        return f"{h}:{m:02d}:{s:02d}"
    return f"{m}:{s:02d}"


def generate_notes(
    title: str,
    transcript: dict,
    frames: list[dict],
    output_dir: str,
    language: str,
) -> str:
    """
    Use Claude to create structured notes, then wrap in HTML template.
    Returns the output HTML path.
    """
    import anthropic
    client = anthropic.Anthropic()

    # Copy images to output directory
    img_dir = os.path.join(output_dir, "images")
    os.makedirs(img_dir, exist_ok=True)
    for i, frame in enumerate(frames):
        dest = os.path.join(img_dir, f"slide_{i:03d}.jpg")
        shutil.copy2(frame["path"], dest)
        frame["html_path"] = f"images/slide_{i:03d}.jpg"

    # Build the prompt for Claude
    frame_descriptions = []
    for i, f in enumerate(frames):
        frame_descriptions.append(
            f"[IMG_{i}] timestamp={_format_timestamp(f['timestamp'])} "
            f"label={f['label']} desc=\"{f['description']}\" "
            f"file=\"{f['html_path']}\" "
            f"context=\"{f['transcript_context'][:300]}...\""
        )

    # Truncate transcript if very long
    full_text = transcript["full_text"]
    if len(full_text) > 15000:
        full_text = full_text[:15000] + "\n... [truncated]"

    prompt = f"""You are creating structured study/meeting notes from a video.

VIDEO TITLE: {title}
LANGUAGE: {language} (write notes in this language)

FULL TRANSCRIPT:
{full_text}

CAPTURED VISUAL CONTENT:
{chr(10).join(frame_descriptions)}

YOUR TASK:
Create well-structured notes in JSON format with this schema:
{{
  "summary": "2-3 sentence executive summary",
  "sections": [
    {{
      "title": "Section heading",
      "content": "Main notes in markdown (use **bold**, *italic*, - bullet points)",
      "images": [
        {{
          "file": "images/slide_NNN.jpg",
          "caption": "What this image shows",
          "ref": "IMG_N"
        }}
      ],
      "key_takeaways": ["point 1", "point 2"]
    }}
  ]
}}

RULES:
- Group content into logical sections (3-8 sections typically)
- Place images in the section where they are most relevant
- Write clear, concise notes — not a raw transcript dump
- Include key takeaways per section
- If the video is a presentation, follow its slide structure
- Write in the detected language ({language})

Return ONLY valid JSON, no markdown fences."""

    print("📝 Generating structured notes via Claude...")
    resp = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
    )
    text = resp.content[0].text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    notes = json.loads(text)

    # Build HTML
    html = _build_html(title, notes, language)
    output_path = os.path.join(output_dir, "notes.html")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html)

    print(f"   ✅ Notes saved to: {output_path}")
    return output_path, notes


def _build_html(title: str, notes: dict, language: str) -> str:
    """Generate a polished, self-contained HTML page using Wander Video Noter branding."""

    sections_html = ""
    for i, sec in enumerate(notes.get("sections", [])):
        content = sec.get("content", "")
        content = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", content)
        content = re.sub(r"\*(.+?)\*", r"<em>\1</em>", content)
        content = re.sub(r"^- (.+)$", r"<li>\1</li>", content, flags=re.MULTILINE)
        content = re.sub(r"(<li>.*?</li>(\s*<li>.*?</li>)*)", r"<ul>\1</ul>", content, flags=re.DOTALL)
        content = content.replace("\n", "<br>")

        images_html = ""
        for img in sec.get("images", []):
            images_html += f"""
            <figure class="slide-figure">
                <img src="{img['file']}" alt="{img.get('caption', '')}" loading="lazy">
                <figcaption><span class="fig-icon">◉</span> {img.get('caption', '')}</figcaption>
            </figure>"""

        takeaways_html = ""
        takeaways = sec.get("key_takeaways", [])
        if takeaways:
            items = "".join(f"<li>{t}</li>" for t in takeaways)
            takeaways_html = f"""
            <div class="takeaways">
                <h4>Kľúčové body</h4>
                <ul>{items}</ul>
            </div>"""

        sections_html += f"""
        <section class="note-section" id="section-{i}">
            <div class="section-number">{str(i+1).zfill(2)}</div>
            <h2>{sec.get('title', f'Section {i+1}')}</h2>
            <div class="section-content">{content}</div>
            {images_html}
            {takeaways_html}
        </section>"""

    toc_items = ""
    for i, sec in enumerate(notes.get("sections", [])):
        toc_items += f'<li><a href="#section-{i}"><span class="toc-num">{str(i+1).zfill(2)}</span>{sec.get("title", f"Section {i+1}")}</a></li>'

    summary = notes.get("summary", "")

    return f"""<!DOCTYPE html>
<html lang="{language}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title} — Wander Video Noter</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root {{
    --primary: #EB002F;
    --primary-light: #FBCCD6;
    --primary-container: #3D0010;
    --bg: #121214;
    --surface: #1A1A1E;
    --surface-high: #242428;
    --border: #2C2C30;
    --text: #E6E1E5;
    --text-muted: #908A8E;
    --heading: #F9FAFB;
    --success: #10B981;
    --font-heading: 'Montserrat', system-ui, sans-serif;
    --font-body: 'Montserrat', system-ui, sans-serif;
    --font-mono: 'JetBrains Mono', monospace;
  }}

  * {{ margin: 0; padding: 0; box-sizing: border-box; }}

  body {{
    font-family: var(--font-body);
    background: var(--bg);
    color: var(--text);
    line-height: 1.7;
    padding: 2rem 1rem;
    font-size: 15px;
  }}

  .container {{ max-width: 860px; margin: 0 auto; }}

  header {{
    margin-bottom: 3rem;
    padding-bottom: 2rem;
    border-bottom: 1px solid var(--border);
  }}

  .brand {{
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 1.5rem;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--primary);
    font-weight: 600;
  }}

  .brand-dot {{
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--primary);
  }}

  h1 {{
    font-family: var(--font-heading);
    font-size: 2.25rem;
    font-weight: 700;
    color: var(--heading);
    margin-bottom: 1rem;
    letter-spacing: -0.03em;
    line-height: 1.15;
  }}

  .summary {{
    font-size: 1rem;
    color: var(--text-muted);
    padding-left: 1rem;
    border-left: 3px solid var(--primary);
  }}

  .toc {{
    background: var(--surface);
    border-radius: 16px;
    padding: 1.5rem 2rem;
    margin-bottom: 2.5rem;
    border: 1px solid var(--border);
  }}

  .toc h3 {{
    font-family: var(--font-heading);
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-muted);
    margin-bottom: 0.75rem;
    font-weight: 600;
  }}

  .toc ul {{ list-style: none; }}

  .toc li {{ margin-bottom: 0.4rem; }}

  .toc a {{
    color: var(--text);
    text-decoration: none;
    font-size: 0.95rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.25rem 0;
    transition: color 0.15s;
    font-weight: 400;
  }}

  .toc a:hover {{ color: var(--primary); }}

  .toc-num {{
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--primary);
    font-weight: 600;
    background: var(--primary-container);
    padding: 2px 8px;
    border-radius: 6px;
  }}

  .note-section {{
    margin-bottom: 2rem;
    padding: 2rem;
    background: var(--surface);
    border-radius: 16px;
    border: 1px solid var(--border);
    position: relative;
  }}

  .section-number {{
    font-family: var(--font-mono);
    font-size: 0.7rem;
    color: var(--primary);
    font-weight: 700;
    background: var(--primary-container);
    padding: 3px 10px;
    border-radius: 6px;
    display: inline-block;
    margin-bottom: 0.75rem;
  }}

  .note-section h2 {{
    font-family: var(--font-heading);
    font-size: 1.4rem;
    font-weight: 600;
    color: var(--heading);
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--border);
    letter-spacing: -0.01em;
  }}

  .section-content {{ margin-bottom: 1.25rem; font-size: 0.95rem; }}
  .section-content ul {{ padding-left: 1.25rem; margin: 0.75rem 0; }}
  .section-content li {{ margin-bottom: 0.35rem; }}
  .section-content strong {{ color: var(--heading); }}

  .slide-figure {{
    margin: 1.5rem 0;
    background: var(--surface-high);
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid var(--border);
  }}

  .slide-figure img {{ width: 100%; display: block; }}

  .slide-figure figcaption {{
    padding: 0.75rem 1rem;
    font-size: 0.85rem;
    color: var(--text-muted);
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }}

  .fig-icon {{ color: var(--primary); font-size: 0.7rem; }}

  .takeaways {{
    background: rgba(16, 185, 129, 0.06);
    border: 1px solid rgba(16, 185, 129, 0.15);
    border-radius: 12px;
    padding: 1.25rem 1.5rem;
    margin-top: 1.25rem;
  }}

  .takeaways h4 {{
    font-family: var(--font-heading);
    font-size: 0.85rem;
    color: var(--success);
    margin-bottom: 0.5rem;
    font-weight: 600;
    letter-spacing: 0.02em;
  }}

  .takeaways ul {{ padding-left: 1.25rem; margin: 0; }}
  .takeaways li {{ margin-bottom: 0.25rem; font-size: 0.9rem; }}

  footer {{
    text-align: center;
    margin-top: 3rem;
    padding-top: 2rem;
    border-top: 1px solid var(--border);
    color: var(--text-muted);
    font-size: 0.8rem;
    font-family: var(--font-mono);
  }}

  @media (max-width: 640px) {{
    h1 {{ font-size: 1.6rem; }}
    .note-section {{ padding: 1.25rem; }}
    body {{ padding: 1rem 0.5rem; }}
  }}
</style>
</head>
<body>
<div class="container">

  <header>
    <div class="brand"><span class="brand-dot"></span> Wander Video Noter</div>
    <h1>{title}</h1>
    <p class="summary">{summary}</p>
  </header>

  <nav class="toc">
    <h3>Obsah</h3>
    <ul>{toc_items}</ul>
  </nav>

  <main>{sections_html}</main>

  <footer>
    Wander Video Noter · Whisper + Claude Vision · Túlavé kino
  </footer>

</div>
</body>
</html>"""


# ═══════════════════════════════════════════════════════════════════════════
# Main pipeline
# ═══════════════════════════════════════════════════════════════════════════

def _write_progress(progress_file: Optional[str], step: str, step_index: int, progress: int, message: str):
    """Write a JSON progress update to the given file. No-op if progress_file is None."""
    if progress_file is None:
        return
    data = {
        "step": step,
        "step_index": step_index,
        "total_steps": 8,
        "progress": progress,
        "message": message,
    }
    try:
        with open(progress_file, "w", encoding="utf-8") as f:
            json.dump(data, f)
    except OSError:
        pass


def run_pipeline(
    source: str,
    output_dir: str = "output",
    whisper_model: str = "base",
    frame_interval: float = 3.0,
    hash_threshold: int = 8,
    skip_classification: bool = False,
    progress_file: Optional[str] = None,
    json_output: bool = False,
):
    _check_deps()

    os.makedirs(output_dir, exist_ok=True)
    work_dir = tempfile.mkdtemp(prefix="vidnotes_")

    try:
        # 1. Download / get video
        _write_progress(progress_file, "download", 0, 0, "Downloading video...")
        video_path, title = get_video(source, work_dir)

        # 2. Audio → Transcript
        _write_progress(progress_file, "audio", 1, 10, "Extracting audio...")
        audio_path = extract_audio(video_path, work_dir)

        _write_progress(progress_file, "transcribe", 2, 20, f"Transcribing with Whisper ({whisper_model})...")
        transcript = transcribe(audio_path, model_name=whisper_model)

        # 3. Extract frames
        _write_progress(progress_file, "frames", 3, 40, f"Extracting frames every {frame_interval}s...")
        frames = extract_frames(video_path, work_dir, interval=frame_interval)

        # 4. Deduplicate
        _write_progress(progress_file, "dedup", 4, 50, "Deduplicating frames...")
        frames = deduplicate_frames(frames, threshold=hash_threshold)

        # 5. Classify (or keep all)
        _write_progress(progress_file, "classify", 5, 60, "Classifying frames via Claude Vision...")
        if skip_classification:
            for f in frames:
                f["label"] = "slide"
                f["description"] = ""
            useful_frames = frames
        else:
            useful_frames = classify_frames(frames)

        # 6. Match to transcript
        _write_progress(progress_file, "match", 6, 80, "Matching frames to transcript...")
        useful_frames = match_frames_to_segments(
            useful_frames, transcript["segments"]
        )

        # 7. Generate HTML
        _write_progress(progress_file, "generate", 7, 85, "Generating structured notes via Claude...")
        html_path, notes = generate_notes(
            title=title,
            transcript=transcript,
            frames=useful_frames,
            output_dir=output_dir,
            language=transcript["language"],
        )

        # 8. Optionally write result.json
        if json_output:
            segments = transcript.get("segments", [])
            duration_seconds = int(segments[-1]["end"]) if segments else 0
            result_data = {
                "title": title,
                "language": transcript.get("language", "unknown"),
                "duration_seconds": duration_seconds,
                "summary": notes.get("summary", ""),
                "sections": [
                    {
                        "title": sec.get("title", ""),
                        "content": sec.get("content", ""),
                        "images": [
                            {"file": img.get("file", ""), "caption": img.get("caption", "")}
                            for img in sec.get("images", [])
                        ],
                        "key_takeaways": sec.get("key_takeaways", []),
                    }
                    for sec in notes.get("sections", [])
                ],
                "transcript_segments": [
                    {"start": seg["start"], "end": seg["end"], "text": seg["text"]}
                    for seg in segments
                ],
                "frame_count": len(useful_frames),
                "tags": [],
            }
            result_path = os.path.join(output_dir, "result.json")
            with open(result_path, "w", encoding="utf-8") as f:
                json.dump(result_data, f, ensure_ascii=False, indent=2)
            print(f"   📄 Result JSON: {result_path}")

        _write_progress(progress_file, "generate", 7, 100, "Done!")

        print("\n" + "═" * 50)
        print(f"✅ Done! Open: {html_path}")
        print(f"   Images: {output_dir}/images/")
        print("═" * 50)
        return html_path

    finally:
        # Cleanup temp directory
        shutil.rmtree(work_dir, ignore_errors=True)


# ═══════════════════════════════════════════════════════════════════════════
# CLI
# ═══════════════════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(
        description="Video → Structured HTML Notes",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python video_notes.py "https://youtube.com/watch?v=abc123"
  python video_notes.py lecture.mp4 --whisper-model medium
  python video_notes.py talk.mp4 --frame-interval 5 --output my_notes
        """,
    )
    parser.add_argument("source", help="YouTube URL or local video file path")
    parser.add_argument(
        "-o", "--output", default="output",
        help="Output directory (default: ./output)"
    )
    parser.add_argument(
        "-w", "--whisper-model", default="base",
        choices=["tiny", "base", "small", "medium", "large"],
        help="Whisper model size (default: base). Larger = more accurate but slower."
    )
    parser.add_argument(
        "-f", "--frame-interval", type=float, default=3.0,
        help="Extract one frame every N seconds (default: 3.0)"
    )
    parser.add_argument(
        "-t", "--hash-threshold", type=int, default=8,
        help="Perceptual hash threshold for dedup (default: 8, lower=stricter)"
    )
    parser.add_argument(
        "--skip-classification", action="store_true",
        help="Skip Claude Vision classification (keep all unique frames)"
    )
    parser.add_argument(
        "--json-progress", metavar="FILEPATH",
        help="Write JSON progress updates to this file at each pipeline step"
    )
    parser.add_argument(
        "--json-output", action="store_true",
        help="Write a result.json file in the output directory with structured data"
    )

    args = parser.parse_args()

    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("⚠️  ANTHROPIC_API_KEY not set. You need it for frame classification & note generation.")
        print("   export ANTHROPIC_API_KEY=sk-ant-...")
        if not args.skip_classification:
            sys.exit(1)

    run_pipeline(
        source=args.source,
        output_dir=args.output,
        whisper_model=args.whisper_model,
        frame_interval=args.frame_interval,
        hash_threshold=args.hash_threshold,
        skip_classification=args.skip_classification,
        progress_file=args.json_progress,
        json_output=args.json_output,
    )


if __name__ == "__main__":
    main()
