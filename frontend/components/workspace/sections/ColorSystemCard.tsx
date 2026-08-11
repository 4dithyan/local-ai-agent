"use client";

import type { ColorSystem } from "@/lib/types";

interface Props {
  data: ColorSystem;
}

export function ColorSystemCard({ data }: Props) {
  return (
    <div className="card">
      <p className="section-label" style={{ marginBottom: "0.875rem" }}>
        Color System
      </p>

      {/* Swatches */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <ColorSwatch label="Background" hex={data.background} />
        <ColorSwatch label="Primary" hex={data.primary} />
        <ColorSwatch label="Accent" hex={data.accent} />
      </div>

      {/* Palette name */}
      <div
        style={{
          padding: "0.5rem 0.75rem",
          background: "var(--bg-overlay)",
          borderRadius: "7px",
          marginBottom: "0.75rem",
        }}
      >
        <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginBottom: "2px" }}>
          Palette
        </p>
        <p style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--text-primary)" }}>
          {data.palette}
        </p>
      </div>

      <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
        {data.description}
      </p>
    </div>
  );
}

function ColorSwatch({ label, hex }: { label: string; hex: string }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.375rem" }}>
      <div
        style={{
          width: "100%",
          height: 48,
          borderRadius: "8px",
          background: hex,
          border: "1px solid var(--border-subtle)",
        }}
      />
      <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>{label}</p>
      <p
        style={{
          fontSize: "0.625rem",
          fontFamily: "var(--font-mono)",
          color: "var(--text-muted)",
        }}
      >
        {hex}
      </p>
    </div>
  );
}
