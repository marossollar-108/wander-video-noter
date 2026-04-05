"use client";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--md-surface)" }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <main
        style={{
          flex: 1,
          marginLeft: collapsed ? 64 : 240,
          padding: "32px 40px",
          maxWidth: 960,
          transition: "margin-left 0.25s cubic-bezier(0.4,0,0.2,1)",
          animation: "fadeIn 0.3s ease",
        }}
      >
        {children}
      </main>
    </div>
  );
}
