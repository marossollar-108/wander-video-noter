"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import type { NoteDetail } from "@/lib/types";
import Icon from "@/components/Icon";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function NoteDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<"notes" | "transcript">("notes");

  const { data, mutate } = useSWR<{ note: NoteDetail }>(
    id ? `/api/notes/${id}` : null,
    fetcher
  );

  const [publishing, setPublishing] = useState(false);
  const [copied, setCopied] = useState(false);

  const note = data?.note;

  const handleCopyLink = useCallback(async () => {
    if (!note) return;
    const url = `${window.location.origin}/galeria/${note.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [note]);

  const handlePublish = useCallback(async () => {
    if (!note || publishing) return;
    setPublishing(true);
    try {
      if (note.published) {
        await fetch(`/api/notes/${note.id}/publish`, { method: "DELETE" });
      } else {
        await fetch(`/api/notes/${note.id}/publish`, { method: "POST" });
      }
      await mutate();
    } finally {
      setPublishing(false);
    }
  }, [note, publishing, mutate]);

  if (!note) {
    return (
      <div style={{ padding: 48, textAlign: "center", color: "var(--md-on-surface-variant)" }}>
        <Icon name="hourglass_top" size={32} style={{ marginBottom: 12, display: "block", margin: "0 auto 12px" }} />
        <div style={{ fontSize: 14 }}>Nacitavam...</div>
      </div>
    );
  }

  const sectionsCount = note.sections?.length ?? 0;
  const imagesCount = note.sections?.reduce((sum, s) => sum + (s.images?.length ?? 0), 0) ?? 0;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Link
          href="/library"
          style={{
            display: "inline-flex",
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
            textDecoration: "none",
          }}
        >
          <Icon name="arrow_back" size={18} />
          Spat do kniznice
        </Link>

        <div>
          <h1 style={{
            fontFamily: "var(--font-heading)", fontSize: 24, fontWeight: 700,
            color: "var(--md-on-surface)", marginBottom: 8, letterSpacing: "-0.02em",
          }}>
            {note.title}
          </h1>

          {/* Metadata row */}
          <div style={{
            display: "flex", gap: 8, flexWrap: "wrap",
            fontSize: 12, color: "var(--md-on-surface-variant)", fontFamily: "var(--font-mono)",
            marginBottom: 12,
          }}>
            {note.duration && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                <Icon name="schedule" size={14} /> {note.duration}
              </span>
            )}
            {note.language && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                <Icon name="language" size={14} /> {note.language.toUpperCase()}
              </span>
            )}
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
              <Icon name="article" size={14} /> {sectionsCount} sekcii
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
              <Icon name="image" size={14} /> {imagesCount} obrazkov
            </span>
          </div>

          {/* YouTube source link */}
          {note.url && (
            <a href={note.url.startsWith("http") ? note.url : `https://${note.url}`} target="_blank" rel="noopener noreferrer" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              fontSize: 13, color: "var(--md-primary)", textDecoration: "none",
              marginBottom: 16, fontFamily: "var(--font-body)",
            }}>
              <Icon name="smart_display" size={16} /> Pozriet povodne video
            </a>
          )}

          {/* Actions — wrapping on mobile */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <button
              onClick={handlePublish}
              disabled={publishing}
              style={{
                padding: "8px 16px",
                borderRadius: 20,
                border: `1px solid ${note.published ? "#10B981" : "var(--md-outline-variant)"}`,
                background: "transparent",
                color: note.published ? "#10B981" : "var(--md-on-surface-variant)",
                cursor: publishing ? "wait" : "pointer",
                fontFamily: "var(--font-body)",
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 6,
                opacity: publishing ? 0.6 : 1,
              }}
            >
              <Icon name={note.published ? "public_off" : "public"} size={16} />
              {note.published ? "Zrusit zverejnenie" : "Zverejnit"}
            </button>
            {note.published && (
              <button
                onClick={handleCopyLink}
                style={{
                  padding: "6px 14px",
                  borderRadius: 20,
                  border: `1px solid ${copied ? "#10B981" : "var(--md-outline-variant)"}`,
                  background: copied ? "#10B98115" : "transparent",
                  color: copied ? "#10B981" : "var(--md-on-surface-variant)",
                  cursor: "pointer",
                  fontFamily: "var(--font-body)",
                  fontSize: 12,
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  transition: "all 0.2s ease",
                }}
              >
                <Icon name={copied ? "check" : "link"} size={14} />
                {copied ? "Skopirovane!" : "Kopirovat odkaz"}
              </button>
            )}
            <button
              onClick={() => {
                if (note.html_path) {
                  const link = document.createElement("a");
                  link.href = `/notes/${note.id}/export`;
                  link.download = `${note.title}.html`;
                  link.click();
                }
              }}
              style={{
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
              }}
            >
              <Icon name="download" size={16} /> Export HTML
            </button>
            <button
              onClick={() => {
                if (note.html_path) {
                  window.open(note.html_path, "_blank");
                }
              }}
              style={{
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
              }}
            >
              <Icon name="open_in_new" size={16} /> Otvorit
            </button>
          </div>
        </div>
      </div>

      {/* Summary card */}
      {note.summary && (
        <div
          style={{
            background: "var(--md-primary-container)",
            borderRadius: 16,
            padding: "16px 20px",
            marginBottom: 24,
            display: "flex",
            gap: 12,
          }}
        >
          <Icon
            name="auto_awesome"
            size={20}
            style={{
              color: "var(--md-on-primary-container)",
              flexShrink: 0,
              marginTop: 2,
            }}
          />
          <p
            style={{
              fontSize: 14,
              color: "var(--md-on-primary-container)",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            {note.summary}
          </p>
        </div>
      )}

      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          gap: 0,
          borderBottom: "1px solid var(--md-outline-variant)",
          marginBottom: 24,
        }}
      >
        {(
          [
            { id: "notes" as const, label: "Poznamky", icon: "description" },
            { id: "transcript" as const, label: "Transkript", icon: "subtitles" },
          ] as const
        ).map((tab) => (
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
          {note.sections?.map((sec, i) => (
            <div
              key={sec.id}
              style={{
                background: "var(--md-surface-container)",
                borderRadius: 16,
                border: "1px solid var(--md-outline-variant)",
                overflow: "hidden",
              }}
            >
              {/* Section header */}
              <div
                style={{
                  padding: "16px 20px",
                  borderBottom: "1px solid var(--md-outline-variant)",
                }}
              >
                <h2
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: 17,
                    fontWeight: 600,
                    color: "var(--md-on-surface)",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                      color: "var(--md-primary)",
                      fontWeight: 700,
                      background: "var(--md-primary-container)",
                      padding: "2px 8px",
                      borderRadius: 6,
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {sec.title}
                </h2>
              </div>

              {/* Section body */}
              <div style={{ padding: 20 }}>
                {/* Content */}
                <div
                  style={{
                    fontSize: 14,
                    color: "var(--md-on-surface)",
                    lineHeight: 1.7,
                    marginBottom: 16,
                    whiteSpace: "pre-wrap",
                  }}
                  dangerouslySetInnerHTML={{ __html: sec.content }}
                />

                {/* Images */}
                {sec.images?.map((img) => (
                  <div
                    key={img.id}
                    style={{
                      background: "var(--md-surface-container-high)",
                      borderRadius: 12,
                      overflow: "hidden",
                      marginBottom: 12,
                      border: "1px solid var(--md-outline-variant)",
                    }}
                  >
                    <img
                      src={`/api/files/notes/${note.id}/${img.file_path}`}
                      alt={img.caption || ""}
                      style={{
                        width: "100%",
                        display: "block",
                        maxHeight: 400,
                        objectFit: "contain",
                        background: "var(--md-surface-container-highest)",
                      }}
                    />
                    {img.caption && (
                      <div
                        style={{
                          padding: "10px 14px",
                          fontSize: 12,
                          color: "var(--md-on-surface-variant)",
                          fontStyle: "italic",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Icon name="photo_camera" size={14} />
                        {img.caption}
                      </div>
                    )}
                  </div>
                ))}

                {/* Key takeaways */}
                {sec.takeaways && sec.takeaways.length > 0 && (
                  <div
                    style={{
                      background: "#10B98110",
                      border: "1px solid #10B98125",
                      borderRadius: 12,
                      padding: "14px 18px",
                      marginTop: 12,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#10B981",
                        marginBottom: 8,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontFamily: "var(--font-heading)",
                      }}
                    >
                      <Icon name="lightbulb" size={15} />
                      Klucove body
                    </div>
                    {sec.takeaways.map((t, k) => (
                      <div
                        key={k}
                        style={{
                          fontSize: 13,
                          color: "var(--md-on-surface)",
                          lineHeight: 1.6,
                          paddingLeft: 16,
                          position: "relative",
                          marginBottom: 4,
                        }}
                      >
                        <span
                          style={{
                            position: "absolute",
                            left: 0,
                            color: "#10B981",
                            fontWeight: 600,
                          }}
                        >
                          ›
                        </span>
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
        <div
          style={{
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
          }}
        >
          <p
            style={{
              color: "var(--md-on-surface-variant)",
              fontStyle: "italic",
              marginBottom: 16,
              fontFamily: "var(--font-body)",
            }}
          >
            Transkript s timestampami
          </p>
          {note.transcript?.map((seg) => (
            <div
              key={seg.id}
              style={{
                display: "flex",
                gap: 16,
                marginBottom: 8,
                padding: "4px 8px",
                borderRadius: 6,
                cursor: "pointer",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--md-surface-container-high)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <span
                style={{
                  color: "var(--md-primary)",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  minWidth: 40,
                }}
              >
                {formatTimestamp(seg.start_time)}
              </span>
              <span>{seg.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
