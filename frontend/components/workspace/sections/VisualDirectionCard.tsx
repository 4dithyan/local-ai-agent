"use client";

import { motion } from "framer-motion";
import type { VisualDirection } from "@/lib/types";

interface Props {
  data: VisualDirection;
}

export function VisualDirectionCard({ data }: Props) {
  return (
    <div className="card group" style={{ position: "relative" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
        <div>
          <p className="section-label" style={{ marginBottom: "0.625rem" }}>Visual Direction</p>
          <h3
            style={{
              fontSize: "1.375rem",
              fontWeight: 700,
              color: "var(--text-primary)",
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
            }}
          >
            {data.style}
          </h3>
          <p
            style={{
              fontSize: "0.8125rem",
              color: "var(--text-secondary)",
              marginTop: "0.5rem",
              lineHeight: 1.6,
            }}
          >
            {data.description}
          </p>
        </div>

        {/* Confidence ring */}
        <div style={{ flexShrink: 0, textAlign: "center" }}>
          <ConfidenceRing value={data.confidence} />
        </div>
      </div>
    </div>
  );
}

function ConfidenceRing({ value }: { value: number }) {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const filled = (value / 100) * circumference;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
      <svg width="60" height="60" style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx="30" cy="30" r={radius}
          fill="none"
          stroke="var(--bg-overlay)"
          strokeWidth="3"
        />
        <motion.circle
          cx="30" cy="30" r={radius}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - filled }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginTop: "-4px" }}>
        {value}% conf.
      </p>
    </div>
  );
}
