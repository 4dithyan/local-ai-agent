"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Copy, Check, FileText } from "lucide-react";
import type { UIResearchReport } from "@/lib/types";

import { VisualDirectionCard } from "./sections/VisualDirectionCard";
import { AnimationStrategyCard } from "./sections/AnimationStrategyCard";
import { ThreeDStrategyCard } from "./sections/ThreeDStrategyCard";
import { TechStackCard } from "./sections/TechStackCard";
import { TypographyCard } from "./sections/TypographyCard";
import { ColorSystemCard } from "./sections/ColorSystemCard";
import { PerformanceCard } from "./sections/PerformanceCard";
import { AvoidCard } from "./sections/AvoidCard";

interface ResearchResultProps {
  report: UIResearchReport;
  prompt: string;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

function CopyButton({ text, id }: { text: string; id: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      id={id}
      className="btn-ghost copy-btn"
      onClick={handleCopy}
      style={{ padding: "0.3125rem 0.625rem", display: "flex", alignItems: "center", gap: "0.375rem" }}
      title="Copy to clipboard"
    >
      {copied ? (
        <Check size={13} style={{ color: "var(--status-green)" }} />
      ) : (
        <Copy size={13} />
      )}
      <span style={{ fontSize: "0.6875rem" }}>{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}

function InfoCard({
  label,
  value,
  copyId,
}: {
  label: string;
  value: string;
  copyId: string;
}) {
  return (
    <div
      className="card group"
      style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p className="section-label">{label}</p>
        <CopyButton text={value} id={copyId} />
      </div>
      <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
        {value}
      </p>
    </div>
  );
}

export function ResearchResult({ report, prompt }: ResearchResultProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyAll = async () => {
    const text = JSON.stringify(report, null, 2);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "1.25rem",
      }}
    >
      {/* Result header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "1rem",
          marginBottom: "1.25rem",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
            <FileText size={15} style={{ color: "var(--accent-light)" }} />
            <span className="section-label" style={{ color: "var(--accent-light)" }}>
              UI Research Report
            </span>
          </div>
          <h1
            style={{
              fontSize: "1rem",
              fontWeight: 600,
              color: "var(--text-primary)",
              letterSpacing: "-0.01em",
              lineHeight: 1.4,
              maxWidth: "480px",
            }}
          >
            {prompt.length > 80 ? prompt.slice(0, 80) + "…" : prompt}
          </h1>
        </div>

        <button
          id="copy-full-report"
          className="btn-ghost"
          onClick={handleCopyAll}
          style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: "0.375rem" }}
        >
          {copied ? <Check size={13} style={{ color: "var(--status-green)" }} /> : <Copy size={13} />}
          <span style={{ fontSize: "0.75rem" }}>{copied ? "Copied!" : "Copy JSON"}</span>
        </button>
      </div>

      {/* Project summary */}
      <div
        style={{
          padding: "0.875rem 1rem",
          background: "var(--accent-subtle)",
          border: "1px solid var(--border-active)",
          borderRadius: "10px",
          marginBottom: "1rem",
        }}
      >
        <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
          {report.project_summary}
        </p>
      </div>

      {/* Cards grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: "0.75rem",
          marginBottom: "0.75rem",
        }}
      >
        <motion.div variants={item}>
          <VisualDirectionCard data={report.visual_direction} />
        </motion.div>
        <motion.div variants={item}>
          <ColorSystemCard data={report.color_system} />
        </motion.div>
        <motion.div variants={item}>
          <TypographyCard data={report.typography} />
        </motion.div>
        <motion.div variants={item}>
          <AnimationStrategyCard data={report.animation_strategy} />
        </motion.div>
        <motion.div variants={item}>
          <ThreeDStrategyCard data={report.three_d_strategy} />
        </motion.div>
        <motion.div variants={item}>
          <PerformanceCard data={report.performance_strategy} />
        </motion.div>
        <motion.div variants={item}>
          <TechStackCard data={report.tech_stack} />
        </motion.div>
        <motion.div variants={item}>
          <AvoidCard items={report.avoid} />
        </motion.div>
      </motion.div>

      {/* Info cards row */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.75rem",
          marginBottom: "0.75rem",
        }}
      >
        <motion.div variants={item}>
          <InfoCard label="Navigation Pattern" value={report.navigation_pattern} copyId="copy-nav" />
        </motion.div>
        <motion.div variants={item}>
          <InfoCard label="Hero Section" value={report.hero_section} copyId="copy-hero" />
        </motion.div>
        <motion.div variants={item}>
          <InfoCard label="Content Layout" value={report.content_layout} copyId="copy-layout" />
        </motion.div>
        <motion.div variants={item}>
          <InfoCard label="Mobile Strategy" value={report.mobile_strategy} copyId="copy-mobile" />
        </motion.div>
        <motion.div variants={item} style={{ gridColumn: "1 / -1" }}>
          <InfoCard label="Accessibility Strategy" value={report.accessibility_strategy} copyId="copy-a11y" />
        </motion.div>
      </motion.div>

      {/* Final blueprint */}
      <motion.div
        variants={item}
        initial="hidden"
        animate="show"
        className="card group"
        style={{ marginBottom: "1.5rem" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
          <p className="section-label">Final Blueprint</p>
          <CopyButton text={report.final_blueprint} id="copy-blueprint" />
        </div>
        <pre
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.8125rem",
            color: "var(--text-secondary)",
            lineHeight: 1.8,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {report.final_blueprint}
        </pre>
      </motion.div>
    </div>
  );
}
