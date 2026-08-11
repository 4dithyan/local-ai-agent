"use client";

import { motion } from "framer-motion";
import { Search, Sparkles } from "lucide-react";

export function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.5rem",
        padding: "3rem 2rem",
        textAlign: "center",
      }}
    >
      {/* Icon cluster */}
      <div
        style={{
          position: "relative",
          width: 72,
          height: 72,
          marginBottom: "0.5rem",
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "20px",
            background: "var(--accent-subtle)",
            border: "1px solid var(--border-active)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Search size={30} style={{ color: "var(--accent-light)" }} />
        </div>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{
            position: "absolute",
            top: -8,
            right: -8,
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Sparkles size={12} style={{ color: "var(--accent)" }} />
        </motion.div>
      </div>

      {/* Text */}
      <div>
        <h2
          style={{
            fontSize: "1.125rem",
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: "0.5rem",
            letterSpacing: "-0.01em",
          }}
        >
          UI Research Agent
        </h2>
        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--text-secondary)",
            maxWidth: "380px",
            lineHeight: 1.6,
          }}
        >
          Describe a website you want to build. The agent will research UI
          patterns, animations, technologies, and produce a structured blueprint.
        </p>
      </div>

      {/* Example prompts */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          width: "100%",
          maxWidth: "420px",
        }}
      >
        <p className="section-label" style={{ textAlign: "left" }}>
          Example prompts
        </p>
        {[
          "Futuristic AI SaaS landing page with subtle 3D and smooth scroll",
          "Minimal portfolio site with elegant typography and micro-interactions",
          "Dark-mode developer dashboard with glass panels and data visualization",
        ].map((prompt) => (
          <div
            key={prompt}
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "8px",
              padding: "0.625rem 0.875rem",
              fontSize: "0.8125rem",
              color: "var(--text-muted)",
              textAlign: "left",
              cursor: "default",
              lineHeight: 1.5,
            }}
          >
            {prompt}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
