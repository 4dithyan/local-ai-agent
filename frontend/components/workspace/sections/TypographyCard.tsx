"use client";

import type { TypographySystem } from "@/lib/types";

interface Props {
  data: TypographySystem;
}

export function TypographyCard({ data }: Props) {
  return (
    <div className="card">
      <p className="section-label" style={{ marginBottom: "0.875rem" }}>
        Typography
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <FontRow label="Primary" value={data.primary_font} mono={false} />
        {data.code_font && (
          <FontRow label="Mono / Code" value={data.code_font} mono={true} />
        )}
        <div
          style={{
            padding: "0.5rem 0.75rem",
            background: "var(--bg-overlay)",
            borderRadius: "7px",
          }}
        >
          <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginBottom: "2px" }}>
            Type Scale
          </p>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
            {data.scale}
          </p>
        </div>
      </div>

      <p
        style={{
          fontSize: "0.8125rem",
          color: "var(--text-secondary)",
          lineHeight: 1.6,
          marginTop: "0.75rem",
        }}
      >
        {data.description}
      </p>

      {/* Preview */}
      <div
        style={{
          marginTop: "1rem",
          padding: "0.875rem",
          background: "var(--bg-overlay)",
          borderRadius: "8px",
          borderLeft: "2px solid var(--accent)",
        }}
      >
        <p
          style={{
            fontFamily: `"${data.primary_font}", var(--font-sans)`,
            fontSize: "1rem",
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: "0.25rem",
          }}
        >
          The quick brown fox
        </p>
        {data.code_font && (
          <p
            style={{
              fontFamily: `"${data.code_font}", var(--font-mono)`,
              fontSize: "0.8125rem",
              color: "var(--text-muted)",
            }}
          >
            const agent = new UIResearchAgent();
          </p>
        )}
      </div>
    </div>
  );
}

function FontRow({ label, value, mono }: { label: string; value: string; mono: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.5rem 0.75rem",
        background: "var(--bg-overlay)",
        borderRadius: "7px",
      }}
    >
      <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>{label}</p>
      <span
        style={{
          fontSize: "0.8125rem",
          fontWeight: 500,
          color: "var(--text-primary)",
          fontFamily: mono ? "var(--font-mono)" : undefined,
        }}
      >
        {value}
      </span>
    </div>
  );
}
