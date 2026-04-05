"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/app/providers";
import Icon from "./Icon";

const NAV_ITEMS = [
  { id: "dashboard", href: "/dashboard", icon: "dashboard", label: "Dashboard" },
  { id: "new", href: "/new", icon: "add_circle", label: "Nové video" },
  { id: "library", href: "/library", icon: "video_library", label: "Knižnica" },
  { id: "queue", href: "/queue", icon: "pending", label: "Fronta" },
  { id: "settings", href: "/settings", icon: "settings", label: "Nastavenia" },
];

export default function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  const isActive = (item: (typeof NAV_ITEMS)[number]) => {
    if (item.id === "dashboard") return pathname === "/dashboard";
    return pathname.startsWith(item.href);
  };

  return (
    <nav
      style={{
        width: collapsed ? 64 : 240,
        minHeight: "100vh",
        background: "var(--md-surface-container)",
        borderRight: "1px solid var(--md-outline-variant)",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.25s cubic-bezier(0.4,0,0.2,1)",
        position: "fixed",
        left: 0,
        top: 0,
        zIndex: 100,
        overflow: "hidden",
      }}
    >
      {/* Logo area */}
      <div
        style={{
          padding: collapsed ? "20px 12px" : "20px 20px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          borderBottom: "1px solid var(--md-outline-variant)",
          minHeight: 72,
        }}
      >
        <img
          src={theme === "dark" ? "/logo-dark.svg" : "/logo.svg"}
          alt="Wander Video Noter"
          style={{
            width: 36,
            height: 44,
            flexShrink: 0,
          }}
        />
        {!collapsed && (
          <div style={{ overflow: "hidden" }}>
            <div
              style={{
                fontFamily: "var(--font-heading)",
                fontWeight: 700,
                fontSize: 15,
                color: "var(--md-on-surface)",
                whiteSpace: "nowrap",
                letterSpacing: "-0.02em",
              }}
            >
              Wander Video
            </div>
            <div
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: 14,
                color: "var(--md-primary)",
                letterSpacing: "0.03em",
                textTransform: "uppercase",
                fontWeight: 700,
                fontStyle: "italic",
              }}
            >
              Noter
            </div>
          </div>
        )}
      </div>

      {/* Nav items */}
      <div style={{ padding: "12px 8px", flex: 1 }}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.id}
              href={item.href}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: collapsed ? "12px 0" : "12px 16px",
                justifyContent: collapsed ? "center" : "flex-start",
                background: active ? "var(--md-secondary-container)" : "transparent",
                color: active
                  ? "var(--md-on-secondary-container)"
                  : "var(--md-on-surface-variant)",
                border: "none",
                borderRadius: 28,
                cursor: "pointer",
                fontFamily: "var(--font-body)",
                fontSize: 14,
                fontWeight: active ? 600 : 400,
                marginBottom: 4,
                transition: "all 0.15s ease",
                position: "relative",
                overflow: "hidden",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                if (!active)
                  (e.currentTarget as HTMLAnchorElement).style.background =
                    "var(--md-surface-container-high)";
              }}
              onMouseLeave={(e) => {
                if (!active)
                  (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
              }}
            >
              <Icon name={item.icon} size={22} />
              {!collapsed && <span style={{ whiteSpace: "nowrap" }}>{item.label}</span>}
            </Link>
          );
        })}
      </div>

      {/* Theme toggle + Collapse toggle */}
      <div
        style={{
          padding: 12,
          borderTop: "1px solid var(--md-outline-variant)",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <button
          onClick={toggleTheme}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            gap: 10,
            padding: collapsed ? "10px 0" : "10px 16px",
            background: "transparent",
            border: "none",
            color: "var(--md-on-surface-variant)",
            cursor: "pointer",
            borderRadius: 28,
            fontSize: 13,
            fontFamily: "var(--font-body)",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background =
              "var(--md-surface-container-high)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background = "transparent")
          }
        >
          <Icon name={theme === "dark" ? "light_mode" : "dark_mode"} size={20} />
          {!collapsed && (
            <span style={{ whiteSpace: "nowrap" }}>
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </span>
          )}
        </button>
        <button
          onClick={onToggle}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "10px 0",
            background: "transparent",
            border: "none",
            color: "var(--md-on-surface-variant)",
            cursor: "pointer",
            borderRadius: 12,
            fontSize: 13,
            fontFamily: "var(--font-body)",
          }}
        >
          <Icon name={collapsed ? "chevron_right" : "chevron_left"} size={20} />
        </button>
      </div>
    </nav>
  );
}
