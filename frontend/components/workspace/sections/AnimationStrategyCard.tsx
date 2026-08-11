"use client";

import { motion } from "framer-motion";
import type { AnimationStrategy, AnimationRecommendation } from "@/lib/types";

interface Props {
  data: AnimationStrategy;
}

const badgeClass: Record<AnimationRecommendation, string> = {
  recommended: "badge-recommended",
  selective: "badge-selective",
  avoid: "badge-avoid",
};

export function AnimationStrategyCard({ data }: Props) {
  return (
    <div className="card">
      <p className="section-label" style={{ marginBottom: "0.875rem" }}>
        Animation Strategy
      </p>

      {/* Intensity bar */}
      <div style={{ marginBottom: "1.25rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "0.375rem",
          }}
        >
          <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", fontWeight: 500 }}>
            Intensity — {data.intensity_label}
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
              color: "var(--accent-light)",
              fontWeight: 600,
            }}
          >
            {data.intensity}/10
          </span>
        </div>
        <div className="intensity-bar">
          <motion.div
            className="intensity-bar-fill"
            style={{ width: `${data.intensity * 10}%` }}
            initial={{ width: 0 }}
            animate={{ width: `${data.intensity * 10}%` }}
            transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
          />
        </div>
        {/* Scale labels */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "0.25rem",
          }}
        >
          <span style={{ fontSize: "0.625rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            static
          </span>
          <span style={{ fontSize: "0.625rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            experimental
          </span>
        </div>
      </div>

      {/* Tools table */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
        {data.tools.map((tool) => (
          <div
            key={tool.name}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "0.75rem",
              padding: "0.5rem 0.75rem",
              background: "var(--bg-overlay)",
              borderRadius: "8px",
            }}
          >
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--text-primary)" }}>
                {tool.name}
              </span>
              <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "1px" }}>
                {tool.reason}
              </p>
            </div>
            <span className={badgeClass[tool.recommendation]}>
              {tool.recommendation}
            </span>
          </div>
        ))}
      </div>

      {/* Scroll behavior */}
      <div
        style={{
          padding: "0.625rem 0.75rem",
          background: "var(--bg-overlay)",
          borderRadius: "8px",
          marginBottom: "0.75rem",
        }}
      >
        <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginBottom: "2px" }}>
          Scroll Behavior
        </p>
        <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
          {data.scroll_behavior}
        </p>
      </div>

      <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
        {data.description}
      </p>
    </div>
  );
}
