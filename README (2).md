# 🎬 Wander Video Noter

Pipeline pre Túlavé kino — vezme YouTube video alebo lokálny súbor a vytvorí krásnu HTML stránku so štruktúrovanými poznámkami — transkripcia, sumarizácia, a inteligentne zachytené slajdy/diagramy.

## Čo to robí

```
Video → Audio → Transkripcia → Framy → Deduplikácia → Klasifikácia → HTML poznámky
         ↓          ↓               ↓            ↓              ↓
       FFmpeg     Whisper        FFmpeg     Perceptual     Claude Vision
                (auto-detect)   (frames)     Hash          (slide vs.
                 language)                                  presenter)
```

### Pipeline v detaile

| Krok | Čo robí | Nástroj |
|------|---------|---------|
| 1 | Stiahne video (ak YouTube) | yt-dlp |
| 2 | Extrahuje audio (16kHz WAV) | FFmpeg |
| 3 | Prepíše audio s timestampami | Whisper (auto-detect jazyk) |
| 4 | Vyťahuje framy každé N sekúnd | FFmpeg |
| 5 | Odstráni duplikáty (podobné framy) | Perceptual hash (imagehash) |
| 6 | Klasifikuje framy — slajd/diagram/kód vs. prezentujúci | Claude Vision API |
| 7 | Priradí obrázky k správnym častiam transkriptu | Timestamp matching |
| 8 | Vygeneruje štruktúrované poznámky | Claude API |
| 9 | Zabalí do HTML stránky | Template s dark theme |

## Setup

### 1. Systémové závislosti

```bash
# Ubuntu/Debian
sudo apt install ffmpeg

# macOS
brew install ffmpeg
```

### 2. Python balíčky

```bash
pip install openai-whisper yt-dlp Pillow imagehash anthropic
```

> **Pozn.:** `openai-whisper` potrebuje PyTorch. Na GPU je rýchlejší, ale funguje aj na CPU.

### 3. API kľúč

```bash
export ANTHROPIC_API_KEY=sk-ant-api03-...
```

## Použitie

### Základné

```bash
# YouTube video
python video_notes.py "https://www.youtube.com/watch?v=dQw4w9WgXcQ"

# Lokálny súbor
python video_notes.py prednaska.mp4
```

### S parametrami

```bash
# Lepší Whisper model (presnejší, ale pomalší)
python video_notes.py video.mp4 --whisper-model medium

# Framy každých 5 sekúnd (menej framov, rýchlejšie)
python video_notes.py video.mp4 --frame-interval 5

# Vlastný výstupný adresár
python video_notes.py video.mp4 --output moje_poznamky

# Prísnejšia deduplikácia (menej obrázkov v poznámkach)
python video_notes.py video.mp4 --hash-threshold 5

# Preskočiť Claude klasifikáciu (lacnejšie, ale nechá aj neužitočné framy)
python video_notes.py video.mp4 --skip-classification
```

### Výstup

```
output/
├── notes.html          ← Hlavný súbor — otvor v prehliadači
└── images/
    ├── slide_000.jpg
    ├── slide_001.jpg
    └── ...
```

## Whisper modely

| Model | Veľkosť | RAM | Rýchlosť | Presnosť |
|-------|---------|-----|-----------|-----------|
| `tiny` | 39 MB | ~1 GB | Najrýchlejší | Základná |
| `base` | 74 MB | ~1 GB | Rýchly | Dobrá (default) |
| `small` | 244 MB | ~2 GB | Stredný | Veľmi dobrá |
| `medium` | 769 MB | ~5 GB | Pomalší | Výborná |
| `large` | 1.5 GB | ~10 GB | Najpomalší | Najlepšia |

Pre slovenčinu/čestinu odporúčam minimálne `small`, ideálne `medium`.

## Náklady (Claude API)

- **Klasifikácia framov:** ~$0.01-0.05 na video (závisí od počtu framov)
- **Generovanie poznámok:** ~$0.01-0.03 na video
- **Celkovo:** Typicky pod $0.10 na video

## Tips

- Pre prednášky s veľa slajdmi použi `--frame-interval 2`
- Pre dlhé talky použi `--frame-interval 5` a `--whisper-model small`
- Ak nepotrebuješ klasifikáciu, `--skip-classification` ušetrí API volania
- Na lokálne spracovanie bez API: `--skip-classification` (Whisper beží lokálne)
