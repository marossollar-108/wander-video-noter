"use client";

import Icon from "./Icon";

const statusConfig: Record<
  string,
  { bg: string; color: string; icon: string; label: string }
> = {
  done: { bg: "#10B98118", color: "#10B981", icon: "check_circle", label: "Hotov\u00e9" },
  processing: { bg: "#F59E0B18", color: "#F59E0B", icon: "hourglass_top", label: "" },
  queued: { bg: "#3B82F618", color: "#3B82F6", icon: "schedule", label: "\u010cak\u00e1" },
  error: { bg: "#EB002F18", color: "#EB002F", icon: "error", label: "Chyba" },
};

export default function StatusBadge({
  status,
  progress = 0,
}: {
  status: string;
  progress?: number;
}) {
  const cfg = statusConfig[status] || statusConfig.queued;
  const label = status === "processing" ? `${progress}%` : cfg.label;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 10px 3px 6px",
        borderRadius: 100,
        fontSize: 11,
        fontWeight: 600,
        background: cfg.bg,
        color: cfg.color,
        whiteSpace: "nowrap",
      }}
    >
      <Icon
        name={cfg.icon}
        size={14}
        style={{
          color: cfg.color,
          ...(status === "processing"
            ? { animation: "spin 1.5s linear infinite" }
            : {}),
        }}
      />
      {label}
    </span>
  );
}
