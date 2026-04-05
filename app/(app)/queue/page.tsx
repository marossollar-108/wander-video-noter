"use client";

import useSWR from "swr";
import type { Note } from "@/lib/types";
import Icon from "@/components/Icon";
import NoteRow from "@/components/NoteRow";
import PipelineSteps from "@/components/PipelineSteps";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const STEP_KEYS = ["download", "audio", "transcribe", "frames", "dedup", "classify", "match", "generate"];

function getActiveStepIndex(currentStep: string | null): number {
  if (!currentStep) return 0;
  const idx = STEP_KEYS.indexOf(currentStep);
  return idx >= 0 ? idx : 0;
}

export default function QueuePage() {
  const { data } = useSWR<{ notes: Note[] }>(
    "/api/notes?status=processing,queued",
    fetcher,
    { refreshInterval: 3000 }
  );

  const notes = data?.notes ?? [];
  const processing = notes.find((n) => n.status === "processing");
  const queued = notes.filter((n) => n.status === "queued");

  const isEmpty = !processing && queued.length === 0;

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
          Fronta spracovania
        </h1>
        <p style={{ color: "var(--md-on-surface-variant)", fontSize: 14 }}>
          {processing ? "1 sa spracovava" : "0 sa spracovava"} · {queued.length} caka
        </p>
      </div>

      {/* Empty state */}
      {isEmpty && (
        <div
          style={{
            background: "var(--md-surface-container)",
            borderRadius: 16,
            border: "1px solid var(--md-outline-variant)",
            padding: 48,
            textAlign: "center",
            color: "var(--md-on-surface-variant)",
          }}
        >
          <Icon
            name="check_circle"
            size={40}
            style={{ marginBottom: 12, display: "block", margin: "0 auto 12px", color: "#10B981" }}
          />
          <div style={{ fontSize: 15, fontWeight: 500 }}>Ziadne videa vo fronte</div>
        </div>
      )}

      {/* Currently processing */}
      {processing && (
        <div
          style={{
            background: "var(--md-surface-container)",
            borderRadius: 16,
            border: "1px solid var(--md-outline-variant)",
            padding: 24,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                background: "#F59E0B",
                boxShadow: "0 0 8px #F59E0B80",
                animation: "pulse 1.5s ease infinite",
              }}
            />
            <h3
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: 16,
                fontWeight: 600,
                color: "var(--md-on-surface)",
                flex: 1,
              }}
            >
              {processing.title}
            </h3>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 13,
                color: "var(--md-primary)",
                fontWeight: 600,
              }}
            >
              {processing.progress}%
            </span>
          </div>

          {/* Progress bar */}
          <div
            style={{
              height: 4,
              background: "var(--md-surface-container-high)",
              borderRadius: 2,
              marginBottom: 24,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${processing.progress}%`,
                background: "var(--md-primary)",
                borderRadius: 2,
                transition: "width 0.5s ease",
              }}
            />
          </div>

          {/* Pipeline steps */}
          <PipelineSteps activeStepIndex={getActiveStepIndex(processing.current_step)} />
        </div>
      )}

      {/* Queued items */}
      {queued.length > 0 && (
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
              padding: "14px 20px",
              borderBottom: "1px solid var(--md-outline-variant)",
            }}
          >
            <h3
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: 14,
                fontWeight: 600,
                color: "var(--md-on-surface-variant)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Cakajuce
            </h3>
          </div>
          {queued.map((note) => (
            <NoteRow key={note.id} note={note} />
          ))}
        </div>
      )}
    </div>
  );
}
