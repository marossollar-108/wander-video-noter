"use client";

import Icon from "./Icon";

export default function StatCard({
  icon,
  label,
  value,
  accent = false,
}: {
  icon: string;
  label: string;
  value: number | string;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "16px 20px",
        background: "var(--md-surface-container)",
        borderRadius: 16,
        border: "1px solid var(--md-outline-variant)",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: accent
            ? "var(--md-primary-container)"
            : "var(--md-surface-container-high)",
        }}
      >
        <Icon
          name={icon}
          size={22}
          style={{
            color: accent
              ? "var(--md-primary)"
              : "var(--md-on-surface-variant)",
          }}
        />
      </div>
      <div>
        <div
          style={{
            fontSize: 11,
            color: "var(--md-on-surface-variant)",
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 26,
            fontWeight: 700,
            fontFamily: "var(--font-heading)",
            color: accent ? "var(--md-primary)" : "var(--md-on-surface)",
            lineHeight: 1.2,
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}
