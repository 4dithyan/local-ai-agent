"use client";

import { StatusDot } from "@/components/ui/StatusDot";

interface SystemStatusProps {
  connected: boolean;
}

export function SystemStatus({ connected }: SystemStatusProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "8px",
        padding: "0.375rem 0.75rem",
      }}
    >
      <StatusDot status={connected ? "active" : "error"} size="sm" />
      <span
        style={{
          fontSize: "0.75rem",
          fontWeight: 500,
          color: connected ? "var(--status-green)" : "var(--status-red)",
          fontFamily: "var(--font-mono)",
        }}
      >
        {connected ? "System Online" : "Offline"}
      </span>
    </div>
  );
}

export function Header({ connected }: { connected: boolean }) {
  return (
    <header
      style={{
        gridColumn: "1 / -1",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 1.25rem",
        background: "var(--bg-surface)",
        borderBottom: "1px solid var(--border-subtle)",
        height: "52px",
        position: "relative",
        zIndex: 10,
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
        <div
          style={{
            width: 28,
            height: 28,
            background: "var(--gradient-accent)",
            borderRadius: "7px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "14px",
          }}
        >
          ◈
        </div>
        <span
          style={{
            fontSize: "0.9375rem",
            fontWeight: 700,
            color: "var(--text-primary)",
            letterSpacing: "-0.02em",
          }}
        >
          Agent Studio
        </span>
        <span
          style={{
            fontSize: "0.625rem",
            fontWeight: 600,
            color: "var(--accent-light)",
            background: "var(--accent-subtle)",
            border: "1px solid var(--accent-glow)",
            borderRadius: "4px",
            padding: "1px 6px",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          V1
        </span>
      </div>

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <span
          style={{
            fontSize: "0.75rem",
            color: "var(--text-muted)",
            fontFamily: "var(--font-mono)",
          }}
        >
          qwen3-vl:4b
        </span>
        <SystemStatus connected={connected} />
      </div>
    </header>
  );
}
