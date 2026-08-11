"use client";

import type { AvoidItem } from "@/lib/types";
import { XCircle } from "lucide-react";

interface Props {
  items: AvoidItem[];
}

export function AvoidCard({ items }: Props) {
  return (
    <div className="card">
      <p className="section-label" style={{ marginBottom: "0.875rem" }}>
        Avoid
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "0.625rem",
              padding: "0.625rem 0.75rem",
              background: "rgba(239, 68, 68, 0.05)",
              border: "1px solid rgba(239, 68, 68, 0.10)",
              borderRadius: "8px",
            }}
          >
            <XCircle
              size={14}
              style={{ color: "var(--status-red)", flexShrink: 0, marginTop: 2 }}
            />
            <div>
              <span style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--text-primary)" }}>
                {item.item}
              </span>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                {item.reason}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
