"use client";

import useSWR from "swr";
import Link from "next/link";
import type { Note, NoteStats } from "@/lib/types";
import StatCard from "@/components/StatCard";
import NoteRow from "@/components/NoteRow";
import Icon from "@/components/Icon";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function DashboardPage() {
  const { data } = useSWR<{ notes: Note[]; stats: NoteStats }>("/api/notes", fetcher);

  const stats = data?.stats;
  const notes = data?.notes ?? [];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
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
          Dashboard
        </h1>
        <p style={{ color: "var(--md-on-surface-variant)", fontSize: 14 }}>
          Prehľad vašich video poznámok
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 32 }}>
        <StatCard
          icon="video_library"
          label="Spracované videá"
          value={stats?.done ?? 0}
          accent
        />
        <StatCard icon="article" label="Sekcie poznámok" value={stats?.totalSections ?? 0} />
        <StatCard icon="image" label="Zachytené slajdy" value={stats?.totalImages ?? 0} />
        <StatCard
          icon="pending"
          label="Vo fronte"
          value={(stats?.queued ?? 0) + (stats?.processing ?? 0)}
        />
      </div>

      {/* Recent activity */}
      <div
        style={{
          background: "var(--md-surface-container)",
          borderRadius: 16,
          border: "1px solid var(--md-outline-variant)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid var(--md-outline-variant)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: 16,
              fontWeight: 600,
              color: "var(--md-on-surface)",
            }}
          >
            Posledná aktivita
          </h3>
          <Link
            href="/library"
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
              textDecoration: "none",
            }}
          >
            Zobraziť všetky <Icon name="arrow_forward" size={16} />
          </Link>
        </div>
        {notes.slice(0, 4).map((note) => (
          <NoteRow key={note.id} note={note} compact />
        ))}
        {notes.length === 0 && (
          <div
            style={{
              padding: "32px 24px",
              textAlign: "center",
              color: "var(--md-on-surface-variant)",
              fontSize: 14,
            }}
          >
            Zatiaľ žiadne poznámky. Začnite pridaním nového videa.
          </div>
        )}
      </div>
    </div>
  );
}
