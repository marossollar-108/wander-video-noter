"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import useSWR from "swr";
import type { Note } from "@/lib/types";
import Icon from "@/components/Icon";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function GaleriaPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useSWR<{ notes: Note[] }>(
    `/api/public/notes${debouncedSearch ? `?search=${encodeURIComponent(debouncedSearch)}` : ""}`,
    fetcher
  );

  const notes = data?.notes ?? [];

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
          href="/dashboard"
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
          Spat do appky
        </Link>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "48px 24px" }}>
        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: 32,
              fontWeight: 700,
              color: "var(--md-on-surface)",
              marginBottom: 8,
              letterSpacing: "-0.02em",
            }}
          >
            Verejna kniznica
          </h1>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 15,
              color: "var(--md-on-surface-variant)",
            }}
          >
            Zdielane video poznamky
          </p>
        </div>

        {/* Search */}
        <div
          style={{
            position: "relative",
            marginBottom: 40,
          }}
        >
          <Icon
            name="search"
            size={20}
            style={{
              position: "absolute",
              left: 16,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--md-on-surface-variant)",
            }}
          />
          <input
            type="text"
            placeholder="Hladat poznamky..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "14px 20px 14px 48px",
              borderRadius: 999,
              border: "1px solid var(--md-outline-variant)",
              background: "var(--md-surface-container)",
              color: "var(--md-on-surface)",
              fontFamily: "var(--font-body)",
              fontSize: 15,
              outline: "none",
            }}
          />
        </div>

        {/* Grid */}
        {isLoading ? (
          <div style={{ textAlign: "center", padding: 48, color: "var(--md-on-surface-variant)" }}>
            <Icon name="hourglass_top" size={32} style={{ display: "block", margin: "0 auto 12px" }} />
            <div style={{ fontSize: 14 }}>Nacitavam...</div>
          </div>
        ) : notes.length === 0 ? (
          <div style={{ textAlign: "center", padding: 64, color: "var(--md-on-surface-variant)" }}>
            <Icon name="library_books" size={48} style={{ display: "block", margin: "0 auto 16px", opacity: 0.4 }} />
            <div style={{ fontSize: 16, fontFamily: "var(--font-heading)", fontWeight: 600 }}>
              Zatial ziadne zdielane poznamky
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 16,
            }}
          >
            {notes.map((note) => (
              <Link
                key={note.id}
                href={`/galeria/${note.id}`}
                style={{ textDecoration: "none" }}
              >
                <div
                  style={{
                    background: "var(--md-surface-container)",
                    borderRadius: 16,
                    border: "1px solid var(--md-outline-variant)",
                    padding: 20,
                    cursor: "pointer",
                    transition: "border-color 0.15s ease, transform 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--md-primary)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--md-outline-variant)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <h3
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: 16,
                      fontWeight: 600,
                      color: "var(--md-on-surface)",
                      marginBottom: 8,
                    }}
                  >
                    {note.title}
                  </h3>

                  {note.summary && (
                    <p
                      style={{
                        fontSize: 13,
                        color: "var(--md-on-surface-variant)",
                        lineHeight: 1.5,
                        marginBottom: 12,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {note.summary}
                    </p>
                  )}

                  {/* Tags */}
                  {note.tags && note.tags.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                      {note.tags.map((tag, i) => (
                        <span
                          key={i}
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 11,
                            padding: "2px 8px",
                            borderRadius: 999,
                            background: "var(--md-primary-container)",
                            color: "var(--md-on-primary-container)",
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Meta row */}
                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      fontSize: 12,
                      color: "var(--md-on-surface-variant)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {note.duration && (
                      <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <Icon name="schedule" size={13} /> {note.duration}
                      </span>
                    )}
                    {note.language && (
                      <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <Icon name="language" size={13} /> {note.language.toUpperCase()}
                      </span>
                    )}
                    {note.published_at && (
                      <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <Icon name="calendar_today" size={13} />
                        {new Date(note.published_at).toLocaleDateString("sk-SK")}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
