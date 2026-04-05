"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import Icon from "@/components/Icon";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function SettingsPage() {
  const { data, mutate } = useSWR<{ settings: Record<string, string> }>("/api/settings", fetcher);

  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data?.settings) {
      setSettings(data.settings);
    }
  }, [data]);

  const update = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      await mutate();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
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
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 12,
    fontWeight: 500,
    color: "var(--md-on-surface-variant)",
    marginBottom: 6,
  };

  const cardStyle: React.CSSProperties = {
    background: "var(--md-surface-container)",
    borderRadius: 16,
    border: "1px solid var(--md-outline-variant)",
    padding: 24,
    marginBottom: 20,
  };

  const cardTitleStyle: React.CSSProperties = {
    fontFamily: "var(--font-heading)",
    fontSize: 15,
    fontWeight: 600,
    color: "var(--md-on-surface)",
    marginBottom: 20,
    display: "flex",
    alignItems: "center",
    gap: 8,
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
          Nastavenia
        </h1>
        <p style={{ color: "var(--md-on-surface-variant)", fontSize: 14 }}>
          Konfiguracia pipeline a API klucov
        </p>
      </div>

      {/* API Keys */}
      <div style={cardStyle}>
        <h3 style={cardTitleStyle}>
          <Icon name="key" size={18} />
          API kluce
        </h3>

        {/* Anthropic API Key */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 6,
            }}
          >
            <label style={{ fontSize: 13, fontWeight: 500, color: "var(--md-on-surface-variant)" }}>
              Anthropic API Key
            </label>
            {settings.anthropic_api_key && (
              <span
                style={{
                  fontSize: 11,
                  color: "#10B981",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontFamily: "var(--font-mono)",
                }}
              >
                <Icon name="check_circle" size={13} /> Pripojene
              </span>
            )}
          </div>
          <input
            type="password"
            placeholder="sk-ant-api03-..."
            value={settings.anthropic_api_key ?? ""}
            onChange={(e) => update("anthropic_api_key", e.target.value)}
            style={inputStyle}
          />
          <div style={{ fontSize: 12, color: "var(--md-on-surface-variant)", marginTop: 4 }}>
            Pre klasifikaciu framov a generovanie poznamok
          </div>
        </div>

        {/* OpenAI API Key */}
        <div style={{ marginBottom: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 6,
            }}
          >
            <label style={{ fontSize: 13, fontWeight: 500, color: "var(--md-on-surface-variant)" }}>
              OpenAI API Key (volitelne)
            </label>
            {settings.openai_api_key && (
              <span
                style={{
                  fontSize: 11,
                  color: "#10B981",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontFamily: "var(--font-mono)",
                }}
              >
                <Icon name="check_circle" size={13} /> Pripojene
              </span>
            )}
          </div>
          <input
            type="password"
            placeholder="sk-..."
            value={settings.openai_api_key ?? ""}
            onChange={(e) => update("openai_api_key", e.target.value)}
            style={inputStyle}
          />
          <div style={{ fontSize: 12, color: "var(--md-on-surface-variant)", marginTop: 4 }}>
            Pre Whisper API (ak nechcete lokalne)
          </div>
        </div>
      </div>

      {/* Default Settings */}
      <div style={cardStyle}>
        <h3 style={cardTitleStyle}>
          <Icon name="tune" size={18} />
          Predvolene nastavenia
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Whisper model */}
          <div>
            <label style={labelStyle}>Whisper model</label>
            <select
              value={settings.default_whisper_model ?? "base"}
              onChange={(e) => update("default_whisper_model", e.target.value)}
              style={{
                ...inputStyle,
                cursor: "pointer",
                appearance: "none",
              }}
            >
              <option value="tiny">tiny</option>
              <option value="base">base</option>
              <option value="small">small</option>
              <option value="medium">medium</option>
              <option value="large">large</option>
            </select>
          </div>

          {/* Frame interval */}
          <div>
            <label style={labelStyle}>Frame interval (s)</label>
            <input
              type="number"
              value={settings.default_frame_interval ?? "3"}
              onChange={(e) => update("default_frame_interval", e.target.value)}
              min={1}
              max={30}
              style={inputStyle}
            />
          </div>

          {/* Hash threshold */}
          <div>
            <label style={labelStyle}>Hash threshold</label>
            <input
              type="number"
              value={settings.default_hash_threshold ?? "8"}
              onChange={(e) => update("default_hash_threshold", e.target.value)}
              min={1}
              max={64}
              style={inputStyle}
            />
          </div>

          {/* Output dir */}
          <div>
            <label style={labelStyle}>Vystupny adresar</label>
            <input
              type="text"
              value={settings.default_output_dir ?? "./output"}
              onChange={(e) => update("default_output_dir", e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      {/* Open source projects */}
      <div style={cardStyle}>
        <h3 style={{ ...cardTitleStyle, marginBottom: 6 }}>
          <Icon name="data_object" size={18} />
          Relevantne open-source projekty
        </h3>
        <p
          style={{
            fontSize: 13,
            color: "var(--md-on-surface-variant)",
            marginBottom: 16,
          }}
        >
          Projekty, ktore inspirovali tento pipeline
        </p>

        {[
          {
            name: "slide-extractor",
            desc: "Extrakcia slajdov z prednasok pomocou imagehash + OCR -> PDF",
            url: "https://github.com/johan456789/slide-extractor",
          },
          {
            name: "transcribee",
            desc: "Kolaborativna transkripcia s whisper.cpp + speaker diarization",
            url: "https://github.com/bugbakery/transcribee",
          },
          {
            name: "Vibe",
            desc: "Lokalna transkripcna appka s AI sumarizaciou",
            url: "https://thewh1teagle.github.io/vibe",
          },
          {
            name: "video-ocr",
            desc: "CLI pre OCR na video framoch s deduplikaciou",
            url: "https://github.com/PinkFloyded/video-ocr",
          },
        ].map((repo) => (
          <a
            key={repo.name}
            href={repo.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 14px",
              borderRadius: 10,
              marginBottom: 4,
              cursor: "pointer",
              textDecoration: "none",
              color: "inherit",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--md-surface-container-high)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <Icon name="code" size={18} style={{ color: "var(--md-on-surface-variant)", flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--md-primary)",
                }}
              >
                {repo.name}
              </span>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--md-on-surface-variant)",
                  marginTop: 1,
                }}
              >
                {repo.desc}
              </div>
            </div>
            <Icon name="open_in_new" size={16} style={{ color: "var(--md-on-surface-variant)" }} />
          </a>
        ))}
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          width: "100%",
          padding: "14px 24px",
          background: saving ? "var(--md-outline-variant)" : "var(--md-primary)",
          color: saving ? "var(--md-on-surface-variant)" : "var(--md-on-primary)",
          border: "none",
          borderRadius: 16,
          fontFamily: "var(--font-heading)",
          fontSize: 15,
          fontWeight: 600,
          cursor: saving ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          transition: "all 0.15s ease",
        }}
      >
        {saving ? (
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
            Ukladam...
          </>
        ) : saved ? (
          <>
            <Icon name="check_circle" size={20} />
            Ulozene
          </>
        ) : (
          <>
            <Icon name="save" size={20} />
            Ulozit nastavenia
          </>
        )}
      </button>
    </div>
  );
}
