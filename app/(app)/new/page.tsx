"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";

export default function NewVideoPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"url" | "file">("url");
  const [url, setUrl] = useState("");
  const [filePath, setFilePath] = useState("");
  const [whisperModel, setWhisperModel] = useState("base");
  const [frameInterval, setFrameInterval] = useState("3");
  const [skipClassify, setSkipClassify] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = mode === "url" ? !!url : !!filePath;

  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: mode === "url" ? url : undefined,
          filePath: mode === "file" ? filePath : undefined,
          whisperModel,
          frameInterval: Number(frameInterval),
          skipClassify,
        }),
      });
      router.push("/queue");
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 640 }}>
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
          Nové video
        </h1>
        <p style={{ color: "var(--md-on-surface-variant)", fontSize: 14 }}>
          Pridajte YouTube URL alebo nahrajte lokálny súbor
        </p>
      </div>

      {/* Mode toggle */}
      <div
        style={{
          display: "flex",
          background: "var(--md-surface-container)",
          borderRadius: 28,
          padding: 4,
          marginBottom: 24,
          border: "1px solid var(--md-outline-variant)",
        }}
      >
        {(
          [
            { id: "url" as const, icon: "link", label: "YouTube URL" },
            { id: "file" as const, icon: "upload_file", label: "Lokálny súbor" },
          ] as const
        ).map((m) => (
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
          <label
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 500,
              color: "var(--md-on-surface-variant)",
              marginBottom: 8,
              fontFamily: "var(--font-body)",
            }}
          >
            YouTube URL
          </label>
          <div
            style={{
              display: "flex",
              background: "var(--md-surface-container)",
              borderRadius: 12,
              border: `1px solid ${url ? "var(--md-primary)" : "var(--md-outline-variant)"}`,
              overflow: "hidden",
              transition: "border-color 0.15s ease",
            }}
          >
            <div
              style={{
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                borderRight: "1px solid var(--md-outline-variant)",
              }}
            >
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
        <div style={{ marginBottom: 24 }}>
          <label
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 500,
              color: "var(--md-on-surface-variant)",
              marginBottom: 8,
              fontFamily: "var(--font-body)",
            }}
          >
            Cesta k súboru
          </label>
          <div
            style={{
              display: "flex",
              background: "var(--md-surface-container)",
              borderRadius: 12,
              border: `1px solid ${filePath ? "var(--md-primary)" : "var(--md-outline-variant)"}`,
              overflow: "hidden",
              transition: "border-color 0.15s ease",
            }}
          >
            <div
              style={{
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                borderRight: "1px solid var(--md-outline-variant)",
              }}
            >
              <Icon name="video_file" size={20} style={{ color: "var(--md-on-surface-variant)" }} />
            </div>
            <input
              type="text"
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
              placeholder="/cesta/k/suboru/video.mp4"
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
      )}

      {/* Settings */}
      <div
        style={{
          background: "var(--md-surface-container)",
          borderRadius: 16,
          border: "1px solid var(--md-outline-variant)",
          padding: 24,
          marginBottom: 24,
        }}
      >
        <h3
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: 14,
            fontWeight: 600,
            color: "var(--md-on-surface)",
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Icon name="tune" size={18} />
          Nastavenia spracovania
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Whisper model */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 500,
                color: "var(--md-on-surface-variant)",
                marginBottom: 6,
              }}
            >
              Whisper model
            </label>
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
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 500,
                color: "var(--md-on-surface-variant)",
                marginBottom: 6,
              }}
            >
              Interval framov (s)
            </label>
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
        <div
          style={{
            marginTop: 16,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
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
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: 9,
                background: "white",
                position: "absolute",
                top: 3,
                left: skipClassify ? 23 : 3,
                transition: "left 0.2s ease",
              }}
            />
          </button>
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "var(--md-on-surface)",
              }}
            >
              Preskočiť klasifikáciu framov
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--md-on-surface-variant)",
              }}
            >
              Nechá všetky unikátne framy (šetrí API volania)
            </div>
          </div>
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={isSubmitting || !canSubmit}
        style={{
          width: "100%",
          padding: "14px 24px",
          background: !canSubmit ? "var(--md-outline-variant)" : "var(--md-primary)",
          color: !canSubmit ? "var(--md-on-surface-variant)" : "var(--md-on-primary)",
          border: "none",
          borderRadius: 16,
          fontFamily: "var(--font-heading)",
          fontSize: 15,
          fontWeight: 600,
          cursor: !canSubmit ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          transition: "all 0.15s ease",
        }}
      >
        {isSubmitting ? (
          <>
            <span
              style={{
                width: 18,
                height: 18,
                border: "2px solid rgba(255,255,255,0.3)",
                borderTopColor: "white",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
                display: "inline-block",
              }}
            />
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
