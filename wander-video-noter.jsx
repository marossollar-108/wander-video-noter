import { useState, useEffect, useRef, useCallback } from "react";

// ─── Mock Data ───────────────────────────────────────────────────────────────

const MOCK_NOTES = [
  {
    id: "n1",
    title: "React Server Components Deep Dive",
    source: "youtube",
    url: "https://youtube.com/watch?v=abc123",
    status: "done",
    language: "en",
    duration: "42:15",
    createdAt: "2026-04-03T14:30:00",
    thumbnail: null,
    sections: 6,
    images: 14,
    summary: "Comprehensive overview of React Server Components architecture, streaming SSR, and practical migration strategies from client-side rendering.",
    tags: ["react", "frontend", "architecture"],
  },
  {
    id: "n2",
    title: "Kubernetes Networking Explained",
    source: "local",
    url: null,
    status: "done",
    language: "en",
    duration: "1:15:30",
    createdAt: "2026-04-02T09:00:00",
    thumbnail: null,
    sections: 8,
    images: 22,
    summary: "Deep dive into Kubernetes networking model covering Services, Ingress, CNI plugins, and network policies with practical examples.",
    tags: ["kubernetes", "devops", "networking"],
  },
  {
    id: "n3",
    title: "Dizajn systémy v praxi — Figma workshop",
    source: "youtube",
    url: "https://youtube.com/watch?v=xyz789",
    status: "processing",
    language: "sk",
    duration: "55:00",
    createdAt: "2026-04-04T10:15:00",
    thumbnail: null,
    progress: 65,
    currentStep: "Klasifikácia framov",
    sections: null,
    images: null,
    summary: null,
    tags: ["design", "figma"],
  },
  {
    id: "n4",
    title: "Machine Learning Pipeline — MLOps Best Practices",
    source: "youtube",
    url: "https://youtube.com/watch?v=ml456",
    status: "queued",
    language: "en",
    duration: "38:22",
    createdAt: "2026-04-04T11:00:00",
    thumbnail: null,
    sections: null,
    images: null,
    summary: null,
    tags: ["ml", "mlops"],
  },
  {
    id: "n5",
    title: "PostgreSQL Performance Tuning",
    source: "local",
    url: null,
    status: "done",
    language: "en",
    duration: "1:02:44",
    createdAt: "2026-03-28T16:00:00",
    thumbnail: null,
    sections: 5,
    images: 11,
    summary: "Practical guide to PostgreSQL query optimization, indexing strategies, EXPLAIN ANALYZE interpretation, and connection pooling.",
    tags: ["database", "postgresql", "performance"],
  },
  {
    id: "n6",
    title: "Úvod do Claude API a tool use",
    source: "youtube",
    url: "https://youtube.com/watch?v=claude1",
    status: "error",
    language: "sk",
    duration: "28:10",
    createdAt: "2026-04-01T08:30:00",
    errorMsg: "Whisper transcription failed — audio codec not supported",
    thumbnail: null,
    sections: null,
    images: null,
    summary: null,
    tags: ["ai", "claude", "api"],
  },
];

const PIPELINE_STEPS = [
  { key: "download", label: "Sťahovanie videa", icon: "download" },
  { key: "audio", label: "Extrakcia audia", icon: "graphic_eq" },
  { key: "transcribe", label: "Transkripcia (Whisper)", icon: "mic" },
  { key: "frames", label: "Extrakcia framov", icon: "burst_mode" },
  { key: "dedup", label: "Deduplikácia", icon: "filter_alt" },
  { key: "classify", label: "Klasifikácia framov", icon: "image_search" },
  { key: "match", label: "Matching timestamp", icon: "sync" },
  { key: "generate", label: "Generovanie poznámok", icon: "auto_awesome" },
];

const MOCK_PREVIEW_SECTIONS = [
  {
    title: "Introduction to Server Components",
    content: "React Server Components represent a fundamental shift in how we think about component rendering. Unlike traditional client components, RSCs execute exclusively on the server, enabling direct database access, reduced bundle sizes, and improved initial page load performance.",
    images: [
      { file: "slide_001.jpg", caption: "RSC Architecture Overview — Server vs Client boundary" },
    ],
    takeaways: [
      "RSCs run only on the server — zero JavaScript shipped to client",
      "Can directly access databases, file systems, and internal services",
      "Reduce client bundle size by up to 30-50%",
    ],
  },
  {
    title: "Streaming SSR & Suspense Integration",
    content: "Server Components integrate deeply with React's Suspense model. Content streams progressively to the client, allowing the browser to render available sections while waiting for slower data fetches. This creates a significantly better perceived performance compared to traditional SSR where the entire page must be ready before sending.",
    images: [
      { file: "slide_004.jpg", caption: "Streaming SSR timeline — progressive rendering vs blocking SSR" },
      { file: "slide_005.jpg", caption: "Suspense boundary placement strategy" },
    ],
    takeaways: [
      "Streaming sends HTML in chunks as data becomes available",
      "Suspense boundaries define loading states at component level",
      "First contentful paint improved by 2-3x in typical apps",
    ],
  },
  {
    title: "Migration Strategy",
    content: "Adopting Server Components doesn't require a full rewrite. The recommended approach is incremental: start by converting leaf components (those with no interactivity) to server components. Data-fetching components are the highest-value targets. Keep interactive elements as client components using the 'use client' directive.",
    images: [
      { file: "slide_008.jpg", caption: "Migration decision tree — which components to convert first" },
    ],
    takeaways: [
      "Start with leaf components that only display data",
      "Use 'use client' directive for interactive components",
      "Server components cannot use useState, useEffect, or event handlers",
    ],
  },
];

// ─── Material Icon helper ────────────────────────────────────────────────────

function Icon({ name, size = 20, className = "", style = {} }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{ fontSize: size, lineHeight: 1, ...style }}
    >
      {name}
    </span>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: "dashboard", icon: "dashboard", label: "Dashboard" },
  { id: "new", icon: "add_circle", label: "Nové video" },
  { id: "library", icon: "video_library", label: "Knižnica" },
  { id: "queue", icon: "pending", label: "Fronta" },
  { id: "settings", icon: "settings", label: "Nastavenia" },
];

function Sidebar({ active, onNavigate, collapsed, onToggle, theme, onThemeToggle }) {
  return (
    <nav style={{
      width: collapsed ? 64 : 240,
      minHeight: "100vh",
      background: "var(--md-surface-container)",
      borderRight: "1px solid var(--md-outline-variant)",
      display: "flex",
      flexDirection: "column",
      transition: "width 0.25s cubic-bezier(0.4,0,0.2,1)",
      position: "fixed",
      left: 0,
      top: 0,
      zIndex: 100,
      overflow: "hidden",
    }}>
      {/* Logo area */}
      <div style={{
        padding: collapsed ? "20px 12px" : "20px 20px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        borderBottom: "1px solid var(--md-outline-variant)",
        minHeight: 72,
      }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: "var(--md-primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          <Icon name="play_circle" size={22} style={{ color: "var(--md-on-primary)" }} />
        </div>
        {!collapsed && (
          <div style={{ overflow: "hidden" }}>
            <div style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 700,
              fontSize: 15,
              color: "var(--md-on-surface)",
              whiteSpace: "nowrap",
              letterSpacing: "-0.02em",
            }}>
              Wander Video
            </div>
            <div style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "var(--md-on-surface-variant)",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}>
              Noter
            </div>
          </div>
        )}
      </div>

      {/* Nav items */}
      <div style={{ padding: "12px 8px", flex: 1 }}>
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: collapsed ? "12px 0" : "12px 16px",
                justifyContent: collapsed ? "center" : "flex-start",
                background: isActive ? "var(--md-secondary-container)" : "transparent",
                color: isActive ? "var(--md-on-secondary-container)" : "var(--md-on-surface-variant)",
                border: "none",
                borderRadius: 28,
                cursor: "pointer",
                fontFamily: "var(--font-body)",
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                marginBottom: 4,
                transition: "all 0.15s ease",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = "var(--md-surface-container-high)";
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = "transparent";
              }}
            >
              <Icon name={item.icon} size={22} />
              {!collapsed && <span style={{ whiteSpace: "nowrap" }}>{item.label}</span>}
              {item.id === "queue" && !collapsed && (
                <span style={{
                  marginLeft: "auto",
                  background: "var(--md-primary)",
                  color: "var(--md-on-primary)",
                  fontSize: 11,
                  fontWeight: 700,
                  borderRadius: 99,
                  padding: "2px 8px",
                  fontFamily: "var(--font-mono)",
                }}>2</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Theme toggle + Collapse toggle */}
      <div style={{ padding: 12, borderTop: "1px solid var(--md-outline-variant)", display: "flex", flexDirection: "column", gap: 4 }}>
        <button
          onClick={onThemeToggle}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            gap: 10,
            padding: collapsed ? "10px 0" : "10px 16px",
            background: "transparent",
            border: "none",
            color: "var(--md-on-surface-variant)",
            cursor: "pointer",
            borderRadius: 28,
            fontSize: 13,
            fontFamily: "var(--font-body)",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "var(--md-surface-container-high)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
        >
          <Icon name={theme === "dark" ? "light_mode" : "dark_mode"} size={20} />
          {!collapsed && (
            <span style={{ whiteSpace: "nowrap" }}>
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </span>
          )}
        </button>
        <button
          onClick={onToggle}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "10px 0",
            background: "transparent",
            border: "none",
            color: "var(--md-on-surface-variant)",
            cursor: "pointer",
            borderRadius: 12,
            fontSize: 13,
            fontFamily: "var(--font-body)",
          }}
        >
          <Icon name={collapsed ? "chevron_right" : "chevron_left"} size={20} />
        </button>
      </div>
    </nav>
  );
}

// ─── Dashboard Page ──────────────────────────────────────────────────────────

function StatCard({ icon, label, value, accent = false }) {
  return (
    <div style={{
      background: accent ? "var(--md-primary-container)" : "var(--md-surface-container)",
      borderRadius: 16,
      padding: "20px 24px",
      border: `1px solid ${accent ? "transparent" : "var(--md-outline-variant)"}`,
      flex: "1 1 200px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: accent ? "var(--md-primary)" : "var(--md-surface-container-high)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <Icon name={icon} size={20} style={{
            color: accent ? "var(--md-on-primary)" : "var(--md-on-surface-variant)",
          }} />
        </div>
        <span style={{
          fontSize: 13,
          color: accent ? "var(--md-on-primary-container)" : "var(--md-on-surface-variant)",
          fontFamily: "var(--font-body)",
          fontWeight: 500,
        }}>{label}</span>
      </div>
      <div style={{
        fontSize: 32,
        fontWeight: 700,
        fontFamily: "var(--font-heading)",
        color: accent ? "var(--md-on-primary-container)" : "var(--md-on-surface)",
        letterSpacing: "-0.03em",
      }}>{value}</div>
    </div>
  );
}

function DashboardPage({ onNavigate }) {
  const doneNotes = MOCK_NOTES.filter(n => n.status === "done");
  const totalSections = doneNotes.reduce((s, n) => s + (n.sections || 0), 0);
  const totalImages = doneNotes.reduce((s, n) => s + (n.images || 0), 0);

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontFamily: "var(--font-heading)",
          fontSize: 28,
          fontWeight: 700,
          color: "var(--md-on-surface)",
          marginBottom: 4,
          letterSpacing: "-0.02em",
        }}>Dashboard</h1>
        <p style={{
          color: "var(--md-on-surface-variant)",
          fontSize: 14,
        }}>Prehľad vašich video poznámok</p>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 32 }}>
        <StatCard icon="video_library" label="Spracované videá" value={doneNotes.length} accent />
        <StatCard icon="article" label="Sekcie poznámok" value={totalSections} />
        <StatCard icon="image" label="Zachytené slajdy" value={totalImages} />
        <StatCard icon="pending" label="Vo fronte" value={MOCK_NOTES.filter(n => n.status === "queued" || n.status === "processing").length} />
      </div>

      {/* Recent activity */}
      <div style={{
        background: "var(--md-surface-container)",
        borderRadius: 16,
        border: "1px solid var(--md-outline-variant)",
        overflow: "hidden",
      }}>
        <div style={{
          padding: "16px 24px",
          borderBottom: "1px solid var(--md-outline-variant)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <h3 style={{
            fontFamily: "var(--font-heading)",
            fontSize: 16,
            fontWeight: 600,
            color: "var(--md-on-surface)",
          }}>Posledná aktivita</h3>
          <button
            onClick={() => onNavigate("library")}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--md-primary)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "var(--font-body)",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            Zobraziť všetky <Icon name="arrow_forward" size={16} />
          </button>
        </div>
        {MOCK_NOTES.slice(0, 4).map((note) => (
          <NoteRow key={note.id} note={note} compact />
        ))}
      </div>
    </div>
  );
}

// ─── Note Row (shared) ───────────────────────────────────────────────────────

function StatusBadge({ status, progress }) {
  const config = {
    done: { bg: "#10B98118", color: "#10B981", icon: "check_circle", label: "Hotové" },
    processing: { bg: "#F59E0B18", color: "#F59E0B", icon: "hourglass_top", label: `${progress || 0}%` },
    queued: { bg: "#3B82F618", color: "#3B82F6", icon: "schedule", label: "Čaká" },
    error: { bg: "#EB002F18", color: "#EB002F", icon: "error", label: "Chyba" },
  }[status] || {};

  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      fontSize: 12,
      fontWeight: 600,
      fontFamily: "var(--font-mono)",
      color: config.color,
      background: config.bg,
      padding: "4px 10px",
      borderRadius: 99,
    }}>
      <Icon name={config.icon} size={14} />
      {config.label}
    </span>
  );
}

function NoteRow({ note, compact = false, onSelect }) {
  return (
    <div
      onClick={() => onSelect?.(note)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: compact ? "12px 24px" : "16px 20px",
        borderBottom: "1px solid var(--md-outline-variant)",
        cursor: onSelect ? "pointer" : "default",
        transition: "background 0.12s ease",
      }}
      onMouseEnter={(e) => onSelect && (e.currentTarget.style.background = "var(--md-surface-container-high)")}
      onMouseLeave={(e) => onSelect && (e.currentTarget.style.background = "transparent")}
    >
      {/* Icon */}
      <div style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        background: note.source === "youtube" ? "#FF000018" : "var(--md-surface-container-high)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}>
        <Icon
          name={note.source === "youtube" ? "smart_display" : "video_file"}
          size={20}
          style={{ color: note.source === "youtube" ? "#FF4444" : "var(--md-on-surface-variant)" }}
        />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: "var(--font-heading)",
          fontSize: 14,
          fontWeight: 600,
          color: "var(--md-on-surface)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}>{note.title}</div>
        <div style={{
          fontSize: 12,
          color: "var(--md-on-surface-variant)",
          marginTop: 2,
          display: "flex",
          gap: 12,
          fontFamily: "var(--font-mono)",
        }}>
          <span>{note.duration}</span>
          <span>{note.language?.toUpperCase()}</span>
          {note.sections && <span>{note.sections} sekcií</span>}
          {note.images && <span>{note.images} obr.</span>}
        </div>
      </div>

      {/* Tags */}
      {!compact && note.tags && (
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          {note.tags.slice(0, 3).map((t) => (
            <span key={t} style={{
              fontSize: 11,
              color: "var(--md-on-surface-variant)",
              background: "var(--md-surface-container-high)",
              padding: "2px 8px",
              borderRadius: 99,
              fontFamily: "var(--font-mono)",
            }}>{t}</span>
          ))}
        </div>
      )}

      {/* Status */}
      <StatusBadge status={note.status} progress={note.progress} />

      {/* Date */}
      <span style={{
        fontSize: 12,
        color: "var(--md-on-surface-variant)",
        fontFamily: "var(--font-mono)",
        whiteSpace: "nowrap",
        width: 80,
        textAlign: "right",
        flexShrink: 0,
      }}>
        {new Date(note.createdAt).toLocaleDateString("sk-SK", { day: "numeric", month: "short" })}
      </span>
    </div>
  );
}

// ─── New Video Page ──────────────────────────────────────────────────────────

function NewVideoPage({ onNavigate }) {
  const [mode, setMode] = useState("url"); // url | file
  const [url, setUrl] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState(null);
  const [whisperModel, setWhisperModel] = useState("base");
  const [frameInterval, setFrameInterval] = useState("3");
  const [skipClassify, setSkipClassify] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onNavigate("queue");
    }, 1500);
  };

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontFamily: "var(--font-heading)",
          fontSize: 28,
          fontWeight: 700,
          color: "var(--md-on-surface)",
          marginBottom: 4,
          letterSpacing: "-0.02em",
        }}>Nové video</h1>
        <p style={{ color: "var(--md-on-surface-variant)", fontSize: 14 }}>
          Pridajte YouTube URL alebo nahrajte lokálny súbor
        </p>
      </div>

      {/* Mode toggle */}
      <div style={{
        display: "flex",
        background: "var(--md-surface-container)",
        borderRadius: 28,
        padding: 4,
        marginBottom: 24,
        border: "1px solid var(--md-outline-variant)",
      }}>
        {[
          { id: "url", icon: "link", label: "YouTube URL" },
          { id: "file", icon: "upload_file", label: "Lokálny súbor" },
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "10px 0",
              borderRadius: 24,
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
              fontSize: 14,
              fontWeight: mode === m.id ? 600 : 400,
              background: mode === m.id ? "var(--md-primary)" : "transparent",
              color: mode === m.id ? "var(--md-on-primary)" : "var(--md-on-surface-variant)",
              transition: "all 0.2s ease",
            }}
          >
            <Icon name={m.icon} size={18} />
            {m.label}
          </button>
        ))}
      </div>

      {/* URL input */}
      {mode === "url" ? (
        <div style={{ marginBottom: 24 }}>
          <label style={{
            display: "block",
            fontSize: 13,
            fontWeight: 500,
            color: "var(--md-on-surface-variant)",
            marginBottom: 8,
            fontFamily: "var(--font-body)",
          }}>YouTube URL</label>
          <div style={{
            display: "flex",
            background: "var(--md-surface-container)",
            borderRadius: 12,
            border: `1px solid ${url ? "var(--md-primary)" : "var(--md-outline-variant)"}`,
            overflow: "hidden",
            transition: "border-color 0.15s ease",
          }}>
            <div style={{
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              borderRight: "1px solid var(--md-outline-variant)",
            }}>
              <Icon name="smart_display" size={20} style={{ color: "#FF4444" }} />
            </div>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              style={{
                flex: 1,
                padding: "12px 16px",
                background: "transparent",
                border: "none",
                outline: "none",
                color: "var(--md-on-surface)",
                fontFamily: "var(--font-mono)",
                fontSize: 14,
              }}
            />
          </div>
        </div>
      ) : (
        <div
          style={{
            marginBottom: 24,
            border: `2px dashed ${dragOver ? "var(--md-primary)" : "var(--md-outline-variant)"}`,
            borderRadius: 16,
            padding: fileName ? "20px 24px" : "48px 24px",
            textAlign: "center",
            background: dragOver ? "var(--md-primary-container)" : "var(--md-surface-container)",
            transition: "all 0.2s ease",
            cursor: "pointer",
          }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files[0];
            if (file) setFileName(file.name);
          }}
          onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "video/*";
            input.onchange = (e) => {
              if (e.target.files[0]) setFileName(e.target.files[0].name);
            };
            input.click();
          }}
        >
          {fileName ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Icon name="video_file" size={28} style={{ color: "var(--md-primary)" }} />
              <div style={{ textAlign: "left" }}>
                <div style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 14,
                  fontWeight: 500,
                  color: "var(--md-on-surface)",
                }}>{fileName}</div>
                <div style={{
                  fontSize: 12,
                  color: "var(--md-on-surface-variant)",
                  marginTop: 2,
                }}>Kliknite pre zmenu súboru</div>
              </div>
            </div>
          ) : (
            <>
              <Icon name="cloud_upload" size={40} style={{
                color: dragOver ? "var(--md-primary)" : "var(--md-on-surface-variant)",
                marginBottom: 12,
                display: "block",
                margin: "0 auto 12px",
              }} />
              <div style={{
                fontSize: 15,
                fontWeight: 500,
                color: "var(--md-on-surface)",
                marginBottom: 4,
              }}>Pretiahnite video sem</div>
              <div style={{
                fontSize: 13,
                color: "var(--md-on-surface-variant)",
              }}>alebo kliknite pre výber · MP4, MKV, AVI, MOV</div>
            </>
          )}
        </div>
      )}

      {/* Settings */}
      <div style={{
        background: "var(--md-surface-container)",
        borderRadius: 16,
        border: "1px solid var(--md-outline-variant)",
        padding: 24,
        marginBottom: 24,
      }}>
        <h3 style={{
          fontFamily: "var(--font-heading)",
          fontSize: 14,
          fontWeight: 600,
          color: "var(--md-on-surface)",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}>
          <Icon name="tune" size={18} />
          Nastavenia spracovania
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Whisper model */}
          <div>
            <label style={{
              display: "block",
              fontSize: 12,
              fontWeight: 500,
              color: "var(--md-on-surface-variant)",
              marginBottom: 6,
            }}>Whisper model</label>
            <select
              value={whisperModel}
              onChange={(e) => setWhisperModel(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                background: "var(--md-surface-container-high)",
                border: "1px solid var(--md-outline-variant)",
                borderRadius: 8,
                color: "var(--md-on-surface)",
                fontFamily: "var(--font-mono)",
                fontSize: 13,
                outline: "none",
                cursor: "pointer",
                appearance: "none",
              }}
            >
              <option value="tiny">tiny — najrýchlejší</option>
              <option value="base">base — dobrá presnosť</option>
              <option value="small">small — veľmi dobrá</option>
              <option value="medium">medium — výborná (SK/CZ)</option>
              <option value="large">large — najlepšia</option>
            </select>
          </div>

          {/* Frame interval */}
          <div>
            <label style={{
              display: "block",
              fontSize: 12,
              fontWeight: 500,
              color: "var(--md-on-surface-variant)",
              marginBottom: 6,
            }}>Interval framov (s)</label>
            <input
              type="number"
              value={frameInterval}
              onChange={(e) => setFrameInterval(e.target.value)}
              min={1}
              max={30}
              style={{
                width: "100%",
                padding: "10px 12px",
                background: "var(--md-surface-container-high)",
                border: "1px solid var(--md-outline-variant)",
                borderRadius: 8,
                color: "var(--md-on-surface)",
                fontFamily: "var(--font-mono)",
                fontSize: 13,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        {/* Skip classification toggle */}
        <div style={{
          marginTop: 16,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}>
          <button
            onClick={() => setSkipClassify(!skipClassify)}
            style={{
              width: 44,
              height: 24,
              borderRadius: 12,
              border: "none",
              background: skipClassify ? "var(--md-primary)" : "var(--md-outline-variant)",
              cursor: "pointer",
              position: "relative",
              transition: "background 0.2s ease",
              flexShrink: 0,
            }}
          >
            <div style={{
              width: 18,
              height: 18,
              borderRadius: 9,
              background: "white",
              position: "absolute",
              top: 3,
              left: skipClassify ? 23 : 3,
              transition: "left 0.2s ease",
            }} />
          </button>
          <div>
            <div style={{
              fontSize: 13,
              fontWeight: 500,
              color: "var(--md-on-surface)",
            }}>Preskočiť klasifikáciu framov</div>
            <div style={{
              fontSize: 12,
              color: "var(--md-on-surface-variant)",
            }}>Nechá všetky unikátne framy (šetrí API volania)</div>
          </div>
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={isSubmitting || (mode === "url" ? !url : !fileName)}
        style={{
          width: "100%",
          padding: "14px 24px",
          background: (mode === "url" ? !url : !fileName) ? "var(--md-outline-variant)" : "var(--md-primary)",
          color: (mode === "url" ? !url : !fileName) ? "var(--md-on-surface-variant)" : "var(--md-on-primary)",
          border: "none",
          borderRadius: 16,
          fontFamily: "var(--font-heading)",
          fontSize: 15,
          fontWeight: 600,
          cursor: (mode === "url" ? !url : !fileName) ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          transition: "all 0.15s ease",
        }}
      >
        {isSubmitting ? (
          <>
            <span style={{
              width: 18,
              height: 18,
              border: "2px solid rgba(255,255,255,0.3)",
              borderTopColor: "white",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }} />
            Spracováva sa...
          </>
        ) : (
          <>
            <Icon name="auto_awesome" size={20} />
            Spustiť spracovanie
          </>
        )}
      </button>
    </div>
  );
}

// ─── Library Page ────────────────────────────────────────────────────────────

function LibraryPage({ onSelectNote }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = MOCK_NOTES.filter((n) => {
    if (filter === "done" && n.status !== "done") return false;
    if (filter === "active" && n.status !== "processing" && n.status !== "queued") return false;
    if (search && !n.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontFamily: "var(--font-heading)",
          fontSize: 28,
          fontWeight: 700,
          color: "var(--md-on-surface)",
          marginBottom: 4,
          letterSpacing: "-0.02em",
        }}>Knižnica</h1>
        <p style={{ color: "var(--md-on-surface-variant)", fontSize: 14 }}>
          {MOCK_NOTES.filter(n => n.status === "done").length} dokončených · {MOCK_NOTES.filter(n => n.status === "processing" || n.status === "queued").length} v procese
        </p>
      </div>

      {/* Search & Filter bar */}
      <div style={{
        display: "flex",
        gap: 12,
        marginBottom: 20,
        alignItems: "center",
      }}>
        <div style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "var(--md-surface-container)",
          border: "1px solid var(--md-outline-variant)",
          borderRadius: 28,
          padding: "8px 16px",
        }}>
          <Icon name="search" size={20} style={{ color: "var(--md-on-surface-variant)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Hľadať poznámky..."
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--md-on-surface)",
              fontFamily: "var(--font-body)",
              fontSize: 14,
            }}
          />
        </div>

        {["all", "done", "active"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "8px 16px",
              borderRadius: 20,
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
              fontSize: 13,
              fontWeight: filter === f ? 600 : 400,
              background: filter === f ? "var(--md-primary)" : "var(--md-surface-container)",
              color: filter === f ? "var(--md-on-primary)" : "var(--md-on-surface-variant)",
              transition: "all 0.15s ease",
            }}
          >
            {{ all: "Všetky", done: "Hotové", active: "Aktívne" }[f]}
          </button>
        ))}
      </div>

      {/* Notes list */}
      <div style={{
        background: "var(--md-surface-container)",
        borderRadius: 16,
        border: "1px solid var(--md-outline-variant)",
        overflow: "hidden",
      }}>
        {filtered.length === 0 ? (
          <div style={{
            padding: 48,
            textAlign: "center",
            color: "var(--md-on-surface-variant)",
          }}>
            <Icon name="search_off" size={40} style={{ marginBottom: 12, display: "block", margin: "0 auto 12px" }} />
            <div style={{ fontSize: 15, fontWeight: 500 }}>Žiadne výsledky</div>
          </div>
        ) : (
          filtered.map((note) => (
            <NoteRow key={note.id} note={note} onSelect={onSelectNote} />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Queue Page ──────────────────────────────────────────────────────────────

function QueuePage() {
  const processing = MOCK_NOTES.find(n => n.status === "processing");
  const queued = MOCK_NOTES.filter(n => n.status === "queued");

  const [activeStep, setActiveStep] = useState(5); // mock: step 6 of 8

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontFamily: "var(--font-heading)",
          fontSize: 28,
          fontWeight: 700,
          color: "var(--md-on-surface)",
          marginBottom: 4,
          letterSpacing: "-0.02em",
        }}>Fronta spracovania</h1>
        <p style={{ color: "var(--md-on-surface-variant)", fontSize: 14 }}>
          1 sa spracováva · {queued.length} čaká
        </p>
      </div>

      {/* Currently processing */}
      {processing && (
        <div style={{
          background: "var(--md-surface-container)",
          borderRadius: 16,
          border: "1px solid var(--md-outline-variant)",
          padding: 24,
          marginBottom: 24,
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
          }}>
            <div style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              background: "#F59E0B",
              boxShadow: "0 0 8px #F59E0B80",
              animation: "pulse 1.5s ease infinite",
            }} />
            <h3 style={{
              fontFamily: "var(--font-heading)",
              fontSize: 16,
              fontWeight: 600,
              color: "var(--md-on-surface)",
              flex: 1,
            }}>{processing.title}</h3>
            <span style={{
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              color: "var(--md-primary)",
              fontWeight: 600,
            }}>{processing.progress}%</span>
          </div>

          {/* Progress bar */}
          <div style={{
            height: 4,
            background: "var(--md-surface-container-high)",
            borderRadius: 2,
            marginBottom: 24,
            overflow: "hidden",
          }}>
            <div style={{
              height: "100%",
              width: `${processing.progress}%`,
              background: "var(--md-primary)",
              borderRadius: 2,
              transition: "width 0.5s ease",
            }} />
          </div>

          {/* Pipeline steps */}
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {PIPELINE_STEPS.map((step, i) => {
              const status = i < activeStep ? "done" : i === activeStep ? "active" : "pending";
              return (
                <div key={step.key} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "8px 12px",
                  borderRadius: 10,
                  background: status === "active" ? "var(--md-primary-container)" : "transparent",
                }}>
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: status === "done"
                      ? "#10B98120"
                      : status === "active"
                        ? "var(--md-primary)"
                        : "var(--md-surface-container-high)",
                  }}>
                    <Icon
                      name={status === "done" ? "check" : step.icon}
                      size={16}
                      style={{
                        color: status === "done"
                          ? "#10B981"
                          : status === "active"
                            ? "var(--md-on-primary)"
                            : "var(--md-on-surface-variant)",
                      }}
                    />
                  </div>
                  <span style={{
                    fontSize: 13,
                    fontWeight: status === "active" ? 600 : 400,
                    color: status === "pending"
                      ? "var(--md-on-surface-variant)"
                      : "var(--md-on-surface)",
                    fontFamily: "var(--font-body)",
                  }}>{step.label}</span>
                  {status === "active" && (
                    <span style={{
                      marginLeft: "auto",
                      width: 14,
                      height: 14,
                      border: "2px solid var(--md-primary)",
                      borderTopColor: "transparent",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                    }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Queued items */}
      {queued.length > 0 && (
        <div style={{
          background: "var(--md-surface-container)",
          borderRadius: 16,
          border: "1px solid var(--md-outline-variant)",
          overflow: "hidden",
        }}>
          <div style={{
            padding: "14px 20px",
            borderBottom: "1px solid var(--md-outline-variant)",
          }}>
            <h3 style={{
              fontFamily: "var(--font-heading)",
              fontSize: 14,
              fontWeight: 600,
              color: "var(--md-on-surface-variant)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}>Čakajúce</h3>
          </div>
          {queued.map((note) => (
            <NoteRow key={note.id} note={note} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Note Preview / Detail ───────────────────────────────────────────────────

function NotePreview({ note, onBack }) {
  const [activeTab, setActiveTab] = useState("notes"); // notes | transcript

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <button
          onClick={onBack}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "transparent",
            border: "none",
            color: "var(--md-on-surface-variant)",
            cursor: "pointer",
            padding: "6px 0",
            fontFamily: "var(--font-body)",
            fontSize: 13,
            marginBottom: 12,
          }}
        >
          <Icon name="arrow_back" size={18} />
          Späť do knižnice
        </button>

        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <h1 style={{
              fontFamily: "var(--font-heading)",
              fontSize: 24,
              fontWeight: 700,
              color: "var(--md-on-surface)",
              marginBottom: 8,
              letterSpacing: "-0.02em",
            }}>{note.title}</h1>

            <div style={{
              display: "flex",
              gap: 16,
              fontSize: 13,
              color: "var(--md-on-surface-variant)",
              fontFamily: "var(--font-mono)",
            }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Icon name="schedule" size={15} /> {note.duration}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Icon name="language" size={15} /> {note.language?.toUpperCase()}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Icon name="article" size={15} /> {note.sections} sekcií
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Icon name="image" size={15} /> {note.images} obrázkov
              </span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <button style={{
              padding: "8px 16px",
              borderRadius: 20,
              border: "1px solid var(--md-outline-variant)",
              background: "transparent",
              color: "var(--md-on-surface-variant)",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}>
              <Icon name="download" size={16} /> Export HTML
            </button>
            <button style={{
              padding: "8px 16px",
              borderRadius: 20,
              border: "none",
              background: "var(--md-primary)",
              color: "var(--md-on-primary)",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
              fontSize: 13,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}>
              <Icon name="open_in_new" size={16} /> Otvoriť
            </button>
          </div>
        </div>
      </div>

      {/* Summary card */}
      {note.summary && (
        <div style={{
          background: "var(--md-primary-container)",
          borderRadius: 16,
          padding: "16px 20px",
          marginBottom: 24,
          display: "flex",
          gap: 12,
        }}>
          <Icon name="auto_awesome" size={20} style={{
            color: "var(--md-on-primary-container)",
            flexShrink: 0,
            marginTop: 2,
          }} />
          <p style={{
            fontSize: 14,
            color: "var(--md-on-primary-container)",
            lineHeight: 1.6,
            margin: 0,
          }}>{note.summary}</p>
        </div>
      )}

      {/* Tab bar */}
      <div style={{
        display: "flex",
        gap: 0,
        borderBottom: "1px solid var(--md-outline-variant)",
        marginBottom: 24,
      }}>
        {[
          { id: "notes", label: "Poznámky", icon: "description" },
          { id: "transcript", label: "Transkript", icon: "subtitles" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "12px 20px",
              background: "transparent",
              border: "none",
              borderBottom: `2px solid ${activeTab === tab.id ? "var(--md-primary)" : "transparent"}`,
              color: activeTab === tab.id ? "var(--md-primary)" : "var(--md-on-surface-variant)",
              fontFamily: "var(--font-body)",
              fontSize: 14,
              fontWeight: activeTab === tab.id ? 600 : 400,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "all 0.15s ease",
            }}
          >
            <Icon name={tab.icon} size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "notes" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {MOCK_PREVIEW_SECTIONS.map((sec, i) => (
            <div
              key={i}
              style={{
                background: "var(--md-surface-container)",
                borderRadius: 16,
                border: "1px solid var(--md-outline-variant)",
                overflow: "hidden",
              }}
            >
              <div style={{
                padding: "16px 20px",
                borderBottom: "1px solid var(--md-outline-variant)",
              }}>
                <h2 style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: 17,
                  fontWeight: 600,
                  color: "var(--md-on-surface)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}>
                  <span style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    color: "var(--md-primary)",
                    fontWeight: 700,
                    background: "var(--md-primary-container)",
                    padding: "2px 8px",
                    borderRadius: 6,
                  }}>{String(i + 1).padStart(2, "0")}</span>
                  {sec.title}
                </h2>
              </div>

              <div style={{ padding: 20 }}>
                <p style={{
                  fontSize: 14,
                  color: "var(--md-on-surface)",
                  lineHeight: 1.7,
                  marginBottom: 16,
                }}>{sec.content}</p>

                {/* Images */}
                {sec.images?.map((img, j) => (
                  <div key={j} style={{
                    background: "var(--md-surface-container-high)",
                    borderRadius: 12,
                    overflow: "hidden",
                    marginBottom: 12,
                    border: "1px solid var(--md-outline-variant)",
                  }}>
                    <div style={{
                      height: 180,
                      background: `linear-gradient(135deg, var(--md-surface-container-highest) 0%, var(--md-surface-container-high) 100%)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      <Icon name="image" size={40} style={{ color: "var(--md-outline-variant)" }} />
                    </div>
                    <div style={{
                      padding: "10px 14px",
                      fontSize: 12,
                      color: "var(--md-on-surface-variant)",
                      fontStyle: "italic",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}>
                      <Icon name="photo_camera" size={14} />
                      {img.caption}
                    </div>
                  </div>
                ))}

                {/* Key takeaways */}
                {sec.takeaways && (
                  <div style={{
                    background: "#10B98110",
                    border: "1px solid #10B98125",
                    borderRadius: 12,
                    padding: "14px 18px",
                    marginTop: 12,
                  }}>
                    <div style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#10B981",
                      marginBottom: 8,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontFamily: "var(--font-heading)",
                    }}>
                      <Icon name="lightbulb" size={15} />
                      Kľúčové body
                    </div>
                    {sec.takeaways.map((t, k) => (
                      <div key={k} style={{
                        fontSize: 13,
                        color: "var(--md-on-surface)",
                        lineHeight: 1.6,
                        paddingLeft: 16,
                        position: "relative",
                        marginBottom: 4,
                      }}>
                        <span style={{
                          position: "absolute",
                          left: 0,
                          color: "#10B981",
                          fontWeight: 600,
                        }}>›</span>
                        {t}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          background: "var(--md-surface-container)",
          borderRadius: 16,
          border: "1px solid var(--md-outline-variant)",
          padding: 24,
          fontFamily: "var(--font-mono)",
          fontSize: 13,
          lineHeight: 1.8,
          color: "var(--md-on-surface)",
          maxHeight: 600,
          overflow: "auto",
        }}>
          <p style={{ color: "var(--md-on-surface-variant)", fontStyle: "italic", marginBottom: 16, fontFamily: "var(--font-body)" }}>
            Transkript s timestampami — klikni na timestamp pre preskočenie na danú časť videa
          </p>
          {[
            { t: "0:00", text: "Hello everyone. Today we're going to dive deep into React Server Components." },
            { t: "0:15", text: "This is a fundamental shift in how we think about component architecture." },
            { t: "0:32", text: "Let me start by showing you the traditional client-side rendering model." },
            { t: "1:05", text: "As you can see on this slide, the browser downloads the entire JavaScript bundle." },
            { t: "1:28", text: "With Server Components, we can eliminate up to fifty percent of that bundle." },
            { t: "2:10", text: "The key insight is that not every component needs interactivity." },
            { t: "2:45", text: "Let me show you a practical example. Here's a dashboard component..." },
            { t: "3:20", text: "Notice how the data fetching happens directly on the server. No API layer needed." },
          ].map((seg, i) => (
            <div key={i} style={{
              display: "flex",
              gap: 16,
              marginBottom: 8,
              padding: "4px 8px",
              borderRadius: 6,
              cursor: "pointer",
            }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--md-surface-container-high)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <span style={{
                color: "var(--md-primary)",
                fontWeight: 600,
                whiteSpace: "nowrap",
                minWidth: 40,
              }}>{seg.t}</span>
              <span>{seg.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Settings Page ───────────────────────────────────────────────────────────

function SettingsPage() {
  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontFamily: "var(--font-heading)",
          fontSize: 28,
          fontWeight: 700,
          color: "var(--md-on-surface)",
          marginBottom: 4,
          letterSpacing: "-0.02em",
        }}>Nastavenia</h1>
        <p style={{ color: "var(--md-on-surface-variant)", fontSize: 14 }}>
          Konfigurácia pipeline a API kľúčov
        </p>
      </div>

      {/* API Keys */}
      <div style={{
        background: "var(--md-surface-container)",
        borderRadius: 16,
        border: "1px solid var(--md-outline-variant)",
        padding: 24,
        marginBottom: 20,
      }}>
        <h3 style={{
          fontFamily: "var(--font-heading)",
          fontSize: 15,
          fontWeight: 600,
          color: "var(--md-on-surface)",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}>
          <Icon name="key" size={18} />
          API kľúče
        </h3>

        {[
          { label: "Anthropic API Key", placeholder: "sk-ant-api03-...", hint: "Pre klasifikáciu framov a generovanie poznámok", connected: true },
          { label: "OpenAI API Key (voliteľné)", placeholder: "sk-...", hint: "Pre Whisper API (ak nechcete lokálne)", connected: false },
        ].map((item, i) => (
          <div key={i} style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <label style={{
                fontSize: 13,
                fontWeight: 500,
                color: "var(--md-on-surface-variant)",
              }}>{item.label}</label>
              {item.connected && (
                <span style={{
                  fontSize: 11,
                  color: "#10B981",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontFamily: "var(--font-mono)",
                }}>
                  <Icon name="check_circle" size={13} /> Pripojené
                </span>
              )}
            </div>
            <input
              type="password"
              placeholder={item.placeholder}
              defaultValue={item.connected ? "••••••••••••••••••••••" : ""}
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "var(--md-surface-container-high)",
                border: "1px solid var(--md-outline-variant)",
                borderRadius: 10,
                color: "var(--md-on-surface)",
                fontFamily: "var(--font-mono)",
                fontSize: 13,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <div style={{
              fontSize: 12,
              color: "var(--md-on-surface-variant)",
              marginTop: 4,
            }}>{item.hint}</div>
          </div>
        ))}
      </div>

      {/* Default Settings */}
      <div style={{
        background: "var(--md-surface-container)",
        borderRadius: 16,
        border: "1px solid var(--md-outline-variant)",
        padding: 24,
        marginBottom: 20,
      }}>
        <h3 style={{
          fontFamily: "var(--font-heading)",
          fontSize: 15,
          fontWeight: 600,
          color: "var(--md-on-surface)",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}>
          <Icon name="tune" size={18} />
          Predvolené nastavenia
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {[
            { label: "Whisper model", value: "base", options: ["tiny", "base", "small", "medium", "large"] },
            { label: "Frame interval (s)", value: "3", type: "number" },
            { label: "Hash threshold", value: "8", type: "number" },
            { label: "Výstupný adresár", value: "./output", type: "text" },
          ].map((item, i) => (
            <div key={i}>
              <label style={{
                display: "block",
                fontSize: 12,
                fontWeight: 500,
                color: "var(--md-on-surface-variant)",
                marginBottom: 6,
              }}>{item.label}</label>
              {item.options ? (
                <select
                  defaultValue={item.value}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    background: "var(--md-surface-container-high)",
                    border: "1px solid var(--md-outline-variant)",
                    borderRadius: 8,
                    color: "var(--md-on-surface)",
                    fontFamily: "var(--font-mono)",
                    fontSize: 13,
                    outline: "none",
                    cursor: "pointer",
                    appearance: "none",
                  }}
                >
                  {item.options.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input
                  type={item.type}
                  defaultValue={item.value}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    background: "var(--md-surface-container-high)",
                    border: "1px solid var(--md-outline-variant)",
                    borderRadius: 8,
                    color: "var(--md-on-surface)",
                    fontFamily: "var(--font-mono)",
                    fontSize: 13,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Open source repos */}
      <div style={{
        background: "var(--md-surface-container)",
        borderRadius: 16,
        border: "1px solid var(--md-outline-variant)",
        padding: 24,
      }}>
        <h3 style={{
          fontFamily: "var(--font-heading)",
          fontSize: 15,
          fontWeight: 600,
          color: "var(--md-on-surface)",
          marginBottom: 6,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}>
          <Icon name="data_object" size={18} />
          Relevantné open-source projekty
        </h3>
        <p style={{
          fontSize: 13,
          color: "var(--md-on-surface-variant)",
          marginBottom: 16,
        }}>Projekty, ktoré inšpirovali tento pipeline</p>

        {[
          { name: "slide-extractor", desc: "Extrakcia slajdov z prednášok pomocou imagehash + OCR → PDF", url: "github.com/johan456789/slide-extractor" },
          { name: "transcribee", desc: "Kolaboratívna transkripcia s whisper.cpp + speaker diarization", url: "github.com/bugbakery/transcribee" },
          { name: "Vibe", desc: "Lokálna transkripčná appka s AI sumarizáciou", url: "thewh1teagle.github.io/vibe" },
          { name: "video-ocr", desc: "CLI pre OCR na video framoch s deduplikáciou", url: "github.com/PinkFloyded/video-ocr" },
        ].map((repo, i) => (
          <div key={i} style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 14px",
            borderRadius: 10,
            marginBottom: 4,
            cursor: "pointer",
          }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--md-surface-container-high)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            <Icon name="code" size={18} style={{ color: "var(--md-on-surface-variant)", flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <span style={{
                fontFamily: "var(--font-mono)",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--md-primary)",
              }}>{repo.name}</span>
              <div style={{
                fontSize: 12,
                color: "var(--md-on-surface-variant)",
                marginTop: 1,
              }}>{repo.desc}</div>
            </div>
            <Icon name="open_in_new" size={16} style={{ color: "var(--md-on-surface-variant)" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────

export default function WanderVideoNoter() {
  const [page, setPage] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [theme, setTheme] = useState("dark");

  const handleSelectNote = (note) => {
    if (note.status === "done") {
      setSelectedNote(note);
      setPage("preview");
    }
  };

  const renderPage = () => {
    switch (page) {
      case "dashboard":
        return <DashboardPage onNavigate={setPage} />;
      case "new":
        return <NewVideoPage onNavigate={setPage} />;
      case "library":
        return <LibraryPage onSelectNote={handleSelectNote} />;
      case "queue":
        return <QueuePage />;
      case "settings":
        return <SettingsPage />;
      case "preview":
        return selectedNote ? (
          <NotePreview note={selectedNote} onBack={() => { setPage("library"); setSelectedNote(null); }} />
        ) : (
          <LibraryPage onSelectNote={handleSelectNote} />
        );
      default:
        return <DashboardPage onNavigate={setPage} />;
    }
  };

  return (
    <>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
      />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
      />
      <style>{`
        :root, [data-theme="dark"] {
          /* M3 Dark Theme — Túlavé kino brand */
          --md-primary: #EB002F;
          --md-on-primary: #FFFFFF;
          --md-primary-container: #3D0010;
          --md-on-primary-container: #FBCCD6;

          --md-secondary-container: #2A1517;
          --md-on-secondary-container: #F799AD;

          --md-surface: #121214;
          --md-surface-container: #1A1A1E;
          --md-surface-container-high: #242428;
          --md-surface-container-highest: #2E2E33;
          --md-on-surface: #E6E1E5;
          --md-on-surface-variant: #908A8E;

          --md-outline: #49454E;
          --md-outline-variant: #2C2C30;

          --font-heading: 'Montserrat', system-ui, sans-serif;
          --font-body: 'Montserrat', system-ui, sans-serif;
          --font-mono: 'JetBrains Mono', monospace;

          --scrollbar-thumb: #49454E;
        }

        [data-theme="light"] {
          /* M3 Light Theme — Túlavé kino brand */
          --md-primary: #EB002F;
          --md-on-primary: #FFFFFF;
          --md-primary-container: #FBCCD6;
          --md-on-primary-container: #3D0010;

          --md-secondary-container: #F5E0E3;
          --md-on-secondary-container: #7A2531;

          --md-surface: #FDFCFB;
          --md-surface-container: #F5F5F5;
          --md-surface-container-high: #ECEBED;
          --md-surface-container-highest: #E3E2E4;
          --md-on-surface: #1A1A1A;
          --md-on-surface-variant: #777777;

          --md-outline: #A5A5A5;
          --md-outline-variant: #D2D2D2;

          --scrollbar-thumb: #C0BFC2;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        [data-theme] *:not(.material-symbols-outlined) {
          transition: background-color 0.25s ease, border-color 0.25s ease, color 0.2s ease;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb); border-radius: 3px; }

        select option {
          background: var(--md-surface-container);
          color: var(--md-on-surface);
        }

        input::placeholder {
          color: var(--md-on-surface-variant);
          opacity: 0.6;
        }

        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20;
        }
      `}</style>

      <div data-theme={theme} style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--md-surface)",
        fontFamily: "var(--font-body)",
        transition: "background 0.3s ease, color 0.3s ease",
      }}>
        <Sidebar
          active={page === "preview" ? "library" : page}
          onNavigate={(p) => { setPage(p); setSelectedNote(null); }}
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
          theme={theme}
          onThemeToggle={() => setTheme(t => t === "dark" ? "light" : "dark")}
        />

        <main style={{
          flex: 1,
          marginLeft: collapsed ? 64 : 240,
          padding: "32px 40px",
          maxWidth: 960,
          transition: "margin-left 0.25s cubic-bezier(0.4,0,0.2,1)",
          animation: "fadeIn 0.3s ease",
        }}>
          {renderPage()}
        </main>
      </div>
    </>
  );
}
