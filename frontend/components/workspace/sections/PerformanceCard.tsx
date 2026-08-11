"use client";

import type { PerformanceStrategy } from "@/lib/types";
import { CheckCircle2, XCircle } from "lucide-react";

interface Props {
  data: PerformanceStrategy;
}

interface BoolRowProps {
  label: string;
  value: boolean;
}

function BoolRow({ label, value }: BoolRowProps) {
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
      <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>{label}</span>
      {value ? (
        <CheckCircle2 size={15} style={{ color: "var(--status-green)" }} />
      ) : (
        <XCircle size={15} style={{ color: "var(--text-muted)" }} />
      )}
    </div>
  );
}

export function PerformanceCard({ data }: Props) {
  return (
    <div className="card">
      <p className="section-label" style={{ marginBottom: "0.875rem" }}>
        Performance Strategy
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem", marginBottom: "0.875rem" }}>
        <BoolRow label="Mobile Ready" value={data.mobile_ready} />
        <BoolRow label="Reduced Motion Support" value={data.reduced_motion_support} />
        <BoolRow label="Lazy Loading" value={data.lazy_loading} />
      </div>

      <div
        style={{
          padding: "0.5rem 0.75rem",
          background: "var(--bg-overlay)",
          borderRadius: "7px",
          marginBottom: "0.75rem",
        }}
      >
        <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginBottom: "2px" }}>
          Bundle Strategy
        </p>
        <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
          {data.bundle_strategy}
        </p>
      </div>

      <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
        {data.description}
      </p>
    </div>
  );
}
