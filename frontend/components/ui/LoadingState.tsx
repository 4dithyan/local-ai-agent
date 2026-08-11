"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Processing..." }: LoadingStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1rem",
        padding: "3rem",
        color: "var(--text-secondary)",
      }}
    >
      <Loader2
        size={28}
        className="spin-slow"
        style={{ color: "var(--accent)" }}
      />
      <span style={{ fontSize: "0.875rem" }}>{message}</span>
    </motion.div>
  );
}
