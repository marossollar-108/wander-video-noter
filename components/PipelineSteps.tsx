"use client";

import Icon from "./Icon";

const STEPS = [
  { key: "download", label: "S\u0165ahovanie videa", icon: "download" },
  { key: "audio", label: "Extrakcia audia", icon: "graphic_eq" },
  { key: "transcribe", label: "Transkripcia (Whisper)", icon: "mic" },
  { key: "frames", label: "Extrakcia framov", icon: "burst_mode" },
  { key: "dedup", label: "Deduplik\u00e1cia", icon: "filter_alt" },
  { key: "classify", label: "Klasifik\u00e1cia framov", icon: "image_search" },
  { key: "match", label: "Matching timestamp", icon: "sync" },
  { key: "generate", label: "Generovanie pozn\u00e1mok", icon: "auto_awesome" },
];

export default function PipelineSteps({
  activeStepIndex,
}: {
  activeStepIndex: number;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {STEPS.map((step, i) => {
        const isDone = i < activeStepIndex;
        const isActive = i === activeStepIndex;
        const isPending = i > activeStepIndex;

        let iconColor = "var(--md-on-surface-variant)";
        let labelColor = "var(--md-on-surface-variant)";
        let bg = "transparent";
        let statusIcon = "";

        if (isDone) {
          iconColor = "#10B981";
          labelColor = "var(--md-on-surface)";
          statusIcon = "check_circle";
        } else if (isActive) {
          iconColor = "#F59E0B";
          labelColor = "var(--md-on-surface)";
          bg = "var(--md-surface-container-high)";
          statusIcon = "hourglass_top";
        } else if (isPending) {
          iconColor = "var(--md-outline)";
          labelColor = "var(--md-outline)";
          statusIcon = "radio_button_unchecked";
        }

        return (
          <div
            key={step.key}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 14px",
              borderRadius: 12,
              background: bg,
              transition: "background 0.2s ease",
            }}
          >
            {/* Step icon */}
            <Icon name={step.icon} size={20} style={{ color: iconColor, flexShrink: 0 }} />

            {/* Label */}
            <span
              style={{
                flex: 1,
                fontSize: 13,
                fontWeight: isActive ? 600 : 500,
                color: labelColor,
              }}
            >
              {step.label}
            </span>

            {/* Status indicator */}
            <Icon
              name={statusIcon}
              size={16}
              style={{
                color: isDone ? "#10B981" : isActive ? "#F59E0B" : "var(--md-outline)",
                flexShrink: 0,
                ...(isActive ? { animation: "spin 1.5s linear infinite" } : {}),
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
