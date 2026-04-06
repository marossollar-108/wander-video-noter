"use client";

import type { Note } from "@/lib/types";
import Icon from "./Icon";
import StatusBadge from "./StatusBadge";

export default function NoteRow({
  note,
  compact = false,
  onClick,
}: {
  note: Note;
  compact?: boolean;
  onClick?: () => void;
}) {
  const d = new Date(note.created_at + "Z");
  const dateStr = d.toLocaleDateString("sk-SK", { day: "numeric", month: "short" })
    + " " + d.toLocaleTimeString("sk-SK", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: compact ? "10px 16px" : "14px 20px",
        background: "var(--md-surface-container)",
        borderRadius: 14,
        border: "1px solid var(--md-outline-variant)",
        cursor: onClick ? "pointer" : "default",
        transition: "background 0.15s ease",
      }}
      onMouseEnter={(e) => {
        if (onClick)
          (e.currentTarget as HTMLDivElement).style.background =
            "var(--md-surface-container-high)";
      }}
      onMouseLeave={(e) => {
        if (onClick)
          (e.currentTarget as HTMLDivElement).style.background =
            "var(--md-surface-container)";
      }}
    >
      {/* Source icon */}
      <Icon
        name={note.source === "youtube" ? "smart_display" : "video_file"}
        size={22}
        style={{
          color:
            note.source === "youtube"
              ? "#EB002F"
              : "var(--md-on-surface-variant)",
          flexShrink: 0,
        }}
      />

      {/* Title & meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--md-on-surface)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {note.title}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 11,
            color: "var(--md-on-surface-variant)",
            marginTop: 2,
          }}
        >
          {note.duration && <span>{note.duration}</span>}
          {note.language && (
            <span style={{ textTransform: "uppercase" }}>{note.language}</span>
          )}
        </div>

        {/* Tags */}
        {!compact && note.tags && note.tags.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 4,
              marginTop: 6,
            }}
          >
            {note.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: 10,
                  padding: "2px 8px",
                  borderRadius: 100,
                  background: "var(--md-surface-container-high)",
                  color: "var(--md-on-surface-variant)",
                  fontWeight: 500,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Status badge */}
      <StatusBadge status={note.status} progress={note.progress} />

      {/* Date */}
      <span
        style={{
          fontSize: 11,
          color: "var(--md-on-surface-variant)",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        {dateStr}
      </span>
    </div>
  );
}
