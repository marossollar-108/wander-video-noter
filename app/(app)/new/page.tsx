"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

const ACCEPTED_VIDEO_TYPES = ".mp4,.mkv,.avi,.mov,.webm";

export default function NewVideoPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"url" | "file">("url");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [whisperModel, setWhisperModel] = useState("base");
  const [frameInterval, setFrameInterval] = useState("3");
  const [skipClassify, setSkipClassify] = useState(false);
  const [outputLanguage, setOutputLanguage] = useState("auto");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSubmit = mode === "url" ? !!url : !!file;

  const handleFileSelect = useCallback((selectedFile: File | null) => {
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, [handleFileSelect]);

  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting) return;
    setIsSubmitting(true);
    try {
      let uploadedFilePath: string | undefined;

      if (mode === "file" && file) {
        setUploadStatus("Nahráva sa súbor...");
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (!uploadRes.ok) {
          throw new Error("Upload failed");
        }
        const uploadData = await uploadRes.json();
        uploadedFilePath = uploadData.filePath;
      }

      setUploadStatus("Spúšťa sa spracovanie...");
      await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: mode === "url" ? url : undefined,
          filePath: mode === "file" ? uploadedFilePath : undefined,
          fileName: mode === "file" ? fileName : undefined,
          whisperModel,
          frameInterval: Number(frameInterval),
          skipClassify,
          outputLanguage: outputLanguage !== "auto" ? outputLanguage : undefined,
        }),
      });
      router.push("/queue");
    } catch {
      setUploadStatus("");
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
            Video súbor
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_VIDEO_TYPES}
            onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
            style={{ display: "none" }}
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              background: isDragOver
                ? "color-mix(in srgb, var(--md-primary) 8%, var(--md-surface-container))"
                : "var(--md-surface-container)",
              borderRadius: 12,
              border: `2px dashed ${
                isDragOver
                  ? "var(--md-primary)"
                  : file
                    ? "var(--md-primary)"
                    : "var(--md-outline-variant)"
              }`,
              padding: file ? "16px 20px" : "32px 20px",
              cursor: "pointer",
              transition: "all 0.15s ease",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {file ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  width: "100%",
                }}
              >
                <Icon
                  name="video_file"
                  size={28}
                  style={{ color: "var(--md-primary)", flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: "var(--md-on-surface)",
                      fontFamily: "var(--font-body)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {fileName}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--md-on-surface-variant)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {formatFileSize(file.size)}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setFileName("");
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 4,
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--md-on-surface-variant)",
                    flexShrink: 0,
                  }}
                >
                  <Icon name="close" size={18} />
                </button>
              </div>
            ) : (
              <>
                <Icon
                  name="cloud_upload"
                  size={36}
                  style={{
                    color: isDragOver
                      ? "var(--md-primary)"
                      : "var(--md-on-surface-variant)",
                    transition: "color 0.15s ease",
                  }}
                />
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: "var(--md-on-surface)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  Pretiahnite video sem
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--md-on-surface-variant)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  alebo kliknite pre výber · MP4, MKV, AVI, MOV
                </div>
              </>
            )}
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

        {/* Output language */}
        <div style={{ marginBottom: 16 }}>
          <label style={{
            display: "block", fontSize: 12, fontWeight: 500,
            color: "var(--md-on-surface-variant)", marginBottom: 6,
          }}>
            Jazyk poznamok
          </label>
          <select
            value={outputLanguage}
            onChange={(e) => setOutputLanguage(e.target.value)}
            style={{
              width: "100%", padding: "10px 12px",
              background: "var(--md-surface-container-high)",
              border: "1px solid var(--md-outline-variant)",
              borderRadius: 8, color: "var(--md-on-surface)",
              fontFamily: "var(--font-mono)", fontSize: 13,
              outline: "none", cursor: "pointer", appearance: "none",
            }}
          >
            <option value="auto">Automaticky (jazyk videa)</option>
            <option value="sk">Slovenčina</option>
            <option value="cs">Čeština</option>
            <option value="en">English</option>
            <option value="de">Deutsch</option>
            <option value="hu">Magyar</option>
            <option value="pl">Polski</option>
            <option value="fr">Français</option>
            <option value="es">Español</option>
            <option value="it">Italiano</option>
            <option value="uk">Українська</option>
          </select>
        </div>

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
            {uploadStatus || "Spracováva sa..."}
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
