"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import type { NoteDetail } from "@/lib/types";
import Icon from "@/components/Icon";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function PublicNotePage() {
  const params = useParams();
  const id = params.id as string;

  const { data } = useSWR<{ note: NoteDetail }>(
    id ? `/api/public/notes/${id}` : null,
    fetcher
  );

  const note = data?.note;

  if (!note) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--md-surface)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--md-on-surface-variant)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <Icon name="hourglass_top" size={32} style={{ display: "block", margin: "0 auto 12px" }} />
          <div style={{ fontSize: 14 }}>Nacitavam...</div>
        </div>
      </div>
    );
  }

  const sectionsCount = note.sections?.length ?? 0;
  const imagesCount = note.sections?.reduce((sum, s) => sum + (s.images?.length ?? 0), 0) ?? 0;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--md-surface)",
        color: "var(--md-on-surface)",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 32px",
          borderBottom: "1px solid var(--md-outline-variant)",
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: 18,
            fontWeight: 700,
            color: "var(--md-primary)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Icon name="play_circle" size={24} />
          Wander Video Noter
        </Link>
        <Link
          href="/galeria"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 13,
            color: "var(--md-on-surface-variant)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Icon name="arrow_back" size={16} />
          Spat do kniznice
        </Link>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px" }}>
        {/* Title */}
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: 28,
            fontWeight: 700,
            color: "var(--md-on-surface)",
            marginBottom: 16,
            letterSpacing: "-0.02em",
          }}
        >
          {note.title}
        </h1>

        {/* Metadata */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            fontSize: 13,
            color: "var(--md-on-surface-variant)",
            fontFamily: "var(--font-mono)",
            marginBottom: 24,
          }}
        >
          {note.duration && (
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Icon name="schedule" size={15} /> {note.duration}
            </span>
          )}
          {note.language && (
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Icon name="language" size={15} /> {note.language.toUpperCase()}
            </span>
          )}
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Icon name="article" size={15} /> {sectionsCount} sekcii
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Icon name="image" size={15} /> {imagesCount} obrazkov
          </span>
          {note.published_at && (
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Icon name="calendar_today" size={15} />
              {new Date(note.published_at).toLocaleDateString("sk-SK")}
            </span>
          )}
        </div>

        {/* YouTube link */}
        {note.url && (
          <a
            href={note.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 20,
              border: "1px solid var(--md-outline-variant)",
              color: "var(--md-primary)",
              fontFamily: "var(--font-body)",
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 24,
              textDecoration: "none",
            }}
          >
            <Icon name="play_arrow" size={16} />
            Pozriet originalne video
          </a>
        )}

        {/* Summary card */}
        {note.summary && (
          <div
            style={{
              background: "var(--md-primary-container)",
              borderRadius: 16,
              padding: "16px 20px",
              marginBottom: 32,
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

        {/* Sections */}
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

        {/* Footer */}
        <div
          style={{
            textAlign: "center",
            padding: "48px 0 32px",
            borderTop: "1px solid var(--md-outline-variant)",
            marginTop: 48,
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: 14,
              fontWeight: 600,
              color: "var(--md-on-surface-variant)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <Icon name="play_circle" size={18} style={{ color: "var(--md-primary)" }} />
            Wander Video Noter
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--md-outline)",
              marginTop: 4,
            }}
          >
            Video → Strukturovane poznamky
          </div>
        </div>
      </div>
    </div>
  );
}
