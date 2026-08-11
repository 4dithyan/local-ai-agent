"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { ActivityStep } from "@/lib/types";

interface ActivityPanelProps {
  activity: ActivityStep[];
  isRunning: boolean;
}

function ActivityItem({ step, index }: { step: ActivityStep; index: number }) {
  const isRunning = step.status === "running";
  const isDone = step.status === "done";
  const isError = step.status === "error";

  const time = new Date(step.timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return (
    <motion.div
      className="activity-item"
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: 0 }}
      style={{
        display: "flex",
        gap: "0.625rem",
        padding: "0.5rem 0",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      {/* Icon */}
      <div style={{ paddingTop: "2px", flexShrink: 0 }}>
        {isRunning && (
          <Loader2
            size={13}
            className="spin-slow"
            style={{ color: "var(--accent)" }}
          />
        )}
        {isDone && (
          <CheckCircle2 size={13} style={{ color: "var(--status-green)" }} />
        )}
        {isError && (
          <AlertCircle size={13} style={{ color: "var(--status-red)" }} />
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: "0.75rem",
            color: isError
              ? "var(--status-red)"
              : isDone
              ? "var(--text-secondary)"
              : "var(--text-primary)",
            lineHeight: 1.4,
            wordBreak: "break-word",
          }}
        >
          {step.action}
        </p>
        <p
          style={{
            fontSize: "0.625rem",
            color: "var(--text-muted)",
            fontFamily: "var(--font-mono)",
            marginTop: "2px",
          }}
        >
          {time}
        </p>
      </div>
    </motion.div>
  );
}

export function ActivityPanel({ activity, isRunning }: ActivityPanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className="activity-panel"
      style={{
        background: "var(--bg-surface)",
        borderLeft: "1px solid var(--border-subtle)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "1rem 1rem 0.5rem",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <p className="section-label">Live Activity</p>
          {isRunning && (
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--accent)",
                display: "inline-block",
              }}
              className="status-dot-working"
            />
          )}
        </div>
        <button
          className="btn-ghost"
          onClick={() => setCollapsed((c) => !c)}
          style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
          aria-label={collapsed ? "Expand activity log" : "Collapse activity log"}
          id="toggle-activity-log"
        >
          {collapsed ? (
            <ChevronDown size={14} />
          ) : (
            <ChevronUp size={14} />
          )}
        </button>
      </div>

      {/* Activity list */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "0 1rem",
            }}
          >
            {activity.length === 0 ? (
              <div
                style={{
                  padding: "2rem 0",
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontSize: "0.75rem",
                }}
              >
                No activity yet.
                <br />
                Start a research run.
              </div>
            ) : (
              activity.map((step, i) => (
                <ActivityItem key={step.id} step={step} index={i} />
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Count */}
      <div
        style={{
          padding: "0.625rem 1rem",
          borderTop: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: "0.6875rem",
            color: "var(--text-muted)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {activity.length} events
        </span>
        {isRunning && (
          <span
            style={{
              fontSize: "0.6875rem",
              color: "var(--accent-light)",
              fontFamily: "var(--font-mono)",
            }}
          >
            running…
          </span>
        )}
      </div>
    </aside>
  );
}
