"use client";

import { motion } from "framer-motion";

interface StatusDotProps {
  status: "active" | "working" | "idle" | "error";
  size?: "sm" | "md";
}

const colors = {
  active:  "var(--status-green)",
  working: "var(--accent)",
  idle:    "var(--status-muted)",
  error:   "var(--status-red)",
};

const cssClass = {
  active:  "status-dot-active",
  working: "status-dot-working",
  idle:    "",
  error:   "",
};

const sizes = {
  sm: 6,
  md: 8,
};

export function StatusDot({ status, size = "sm" }: StatusDotProps) {
  const px = sizes[size];
  return (
    <span
      className={cssClass[status]}
      style={{
        display: "inline-block",
        width: px,
        height: px,
        borderRadius: "50%",
        background: colors[status],
        flexShrink: 0,
      }}
    />
  );
}
