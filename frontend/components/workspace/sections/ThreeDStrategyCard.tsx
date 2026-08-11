"use client";

import type { ThreeDStrategy } from "@/lib/types";
import { CheckCircle2, XCircle } from "lucide-react";

interface Props {
  data: ThreeDStrategy;
}

const perfColors = {
  good: "var(--status-green)",
  moderate: "var(--status-yellow)",
  heavy: "var(--status-red)",
};

const complexityColors = {
  none: "var(--text-muted)",
  low: "var(--status-green)",
  medium: "var(--status-yellow)",
  high: "var(--status-red)",
};

export function ThreeDStrategyCard({ data }: Props) {
  return (
    <div className="card">
      <p className="section-label" style={{ marginBottom: "0.875rem" }}>
        3D Strategy
      </p>

      {/* Use 3D decision */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          marginBottom: "1rem",
          padding: "0.75rem",
          background: "var(--bg-overlay)",
          borderRadius: "8px",
        }}
      >
        {data.use_3d ? (
          <CheckCircle2 size={18} style={{ color: "var(--status-green)", flexShrink: 0 }} />
        ) : (
          <XCircle size={18} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
        )}
        <div>
          <span style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--text-primary)" }}>
            {data.use_3d ? "Use 3D" : "No 3D Required"}
          </span>
          {data.library && (
            <p style={{ fontSize: "0.75rem", color: "var(--accent-light)", marginTop: "1px" }}>
              {data.library}
            </p>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.5rem",
          marginBottom: "0.875rem",
        }}
      >
        <Stat label="Complexity" value={data.complexity} color={complexityColors[data.complexity]} />
        <Stat label="Performance" value={data.performance_rating} color={perfColors[data.performance_rating]} />
        <div
          style={{
            gridColumn: "1 / -1",
            padding: "0.5rem 0.75rem",
            background: "var(--bg-overlay)",
            borderRadius: "8px",
          }}
        >
          <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginBottom: "2px" }}>Scope</p>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>{data.scope}</p>
        </div>
      </div>

      <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
        {data.description}
      </p>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      style={{
        padding: "0.5rem 0.75rem",
        background: "var(--bg-overlay)",
        borderRadius: "8px",
      }}
    >
      <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginBottom: "2px" }}>{label}</p>
      <p style={{ fontSize: "0.8125rem", fontWeight: 600, color, textTransform: "capitalize" }}>
        {value}
      </p>
    </div>
  );
}
