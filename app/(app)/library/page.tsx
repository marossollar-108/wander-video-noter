"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import type { Note, NoteStats } from "@/lib/types";
import Icon from "@/components/Icon";
import NoteRow from "@/components/NoteRow";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Filter = "all" | "done" | "active";

export default function LibraryPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [expandedError, setExpandedError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<string | null>(null);

  const isYouTubeBotError = (msg: string | null) => {
    if (!msg) return false;
    const lower = msg.toLowerCase();
    return lower.includes("sign in to confirm") || lower.includes("bot");
  };

  const handleRetry = useCallback(async (note: Note) => {
    if (retrying) return;
    setRetrying(note.id);
    try {
      await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: note.url }),
      });
      router.push("/queue");
    } finally {
      setRetrying(null);
    }
  }, [retrying, router]);

  const endpoint =
    filter === "done"
      ? "/api/notes?status=done"
      : filter === "active"
        ? "/api/notes?status=processing,queued"
        : "/api/notes";

  const { data } = useSWR<{ notes: Note[]; stats: NoteStats }>(endpoint, fetcher);

  const allData = useSWR<{ notes: Note[]; stats: NoteStats }>("/api/notes", fetcher);
  const stats = allData.data?.stats;

  const notes = (data?.notes ?? []).filter((n) => {
    if (search && !n.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const filterLabels: Record<Filter, string> = {
    all: "Vsetky",
    done: "Hotove",
    active: "Aktivne",
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: 28,
            fontWeight: 700,
            color: "var(--md-on-surface)",
            marginBottom: 4,
            letterSpacing: "-0.02em",
          }}
        >
          Kniznica
        </h1>
        <p style={{ color: "var(--md-on-surface-variant)", fontSize: 14 }}>
          {stats?.done ?? 0} dokoncených · {(stats?.processing ?? 0) + (stats?.queued ?? 0)} v procese
        </p>
      </div>

      {/* Search & Filter bar */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 20,
          alignItems: "center",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "var(--md-surface-container)",
            border: "1px solid var(--md-outline-variant)",
            borderRadius: 28,
            padding: "8px 16px",
          }}
        >
          <Icon name="search" size={20} style={{ color: "var(--md-on-surface-variant)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Hladat poznamky..."
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

        {(["all", "done", "active"] as Filter[]).map((f) => (
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
            {filterLabels[f]}
          </button>
        ))}
      </div>

      {/* Notes list */}
      <div
        style={{
          background: "var(--md-surface-container)",
          borderRadius: 16,
          border: "1px solid var(--md-outline-variant)",
          overflow: "hidden",
        }}
      >
        {notes.length === 0 ? (
          <div
            style={{
              padding: 48,
              textAlign: "center",
              color: "var(--md-on-surface-variant)",
            }}
          >
            <Icon
              name="search_off"
              size={40}
              style={{ marginBottom: 12, display: "block", margin: "0 auto 12px" }}
            />
            <div style={{ fontSize: 15, fontWeight: 500 }}>Ziadne vysledky</div>
          </div>
        ) : (
          notes.map((note) => (
            <div key={note.id}>
              <NoteRow
                note={note}
                onClick={
                  note.status === "done"
                    ? () => router.push(`/notes/${note.id}`)
                    : note.status === "error"
                      ? () => setExpandedError(expandedError === note.id ? null : note.id)
                      : undefined
                }
              />
              {note.status === "error" && expandedError === note.id && (
                <div
                  style={{
                    padding: "16px 20px",
                    background: "var(--md-error-container, #930006)",
                    borderBottom: "1px solid var(--md-outline-variant)",
                  }}
                >
                  {/* Error message */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      marginBottom: 12,
                    }}
                  >
                    <Icon
                      name="error"
                      size={18}
                      style={{ color: "var(--md-on-error-container, #FFB4AB)", flexShrink: 0, marginTop: 1 }}
                    />
                    <div style={{ fontSize: 13, color: "var(--md-on-error-container, #FFB4AB)", lineHeight: 1.5 }}>
                      {note.error_msg || "Neznama chyba"}
                    </div>
                  </div>

                  {/* YouTube bot detection hint */}
                  {isYouTubeBotError(note.error_msg) && (
                    <div
                      style={{
                        background: "var(--md-surface-container)",
                        borderRadius: 10,
                        padding: "12px 16px",
                        marginBottom: 12,
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                      }}
                    >
                      <Icon
                        name="info"
                        size={18}
                        style={{ color: "var(--md-primary)", flexShrink: 0, marginTop: 1 }}
                      />
                      <div style={{ fontSize: 13, color: "var(--md-on-surface)", lineHeight: 1.5 }}>
                        YouTube blokuje stahovanie zo servera. Stiahnite si video manualne a nahrajte ho cez &quot;Lokalny subor&quot;.
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {note.url && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRetry(note); }}
                        disabled={retrying === note.id}
                        style={{
                          padding: "7px 14px",
                          borderRadius: 20,
                          border: "1px solid var(--md-outline-variant)",
                          background: "var(--md-surface-container)",
                          color: "var(--md-on-surface)",
                          cursor: retrying === note.id ? "wait" : "pointer",
                          fontFamily: "var(--font-body)",
                          fontSize: 12,
                          fontWeight: 500,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          opacity: retrying === note.id ? 0.6 : 1,
                        }}
                      >
                        <Icon name="refresh" size={15} />
                        {retrying === note.id ? "Posielam..." : "Skusit znova"}
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); router.push("/new"); }}
                      style={{
                        padding: "7px 14px",
                        borderRadius: 20,
                        border: "1px solid var(--md-outline-variant)",
                        background: "var(--md-surface-container)",
                        color: "var(--md-on-surface)",
                        cursor: "pointer",
                        fontFamily: "var(--font-body)",
                        fontSize: 12,
                        fontWeight: 500,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <Icon name="upload_file" size={15} />
                      Nahrat manualne
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setExpandedError(null); }}
                      style={{
                        padding: "7px 14px",
                        borderRadius: 20,
                        border: "1px solid var(--md-outline-variant)",
                        background: "transparent",
                        color: "var(--md-on-surface-variant)",
                        cursor: "pointer",
                        fontFamily: "var(--font-body)",
                        fontSize: 12,
                        fontWeight: 500,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      Zavriet
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
