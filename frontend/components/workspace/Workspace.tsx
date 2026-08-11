"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, AlertCircle, RotateCcw, Loader2 } from "lucide-react";
import { EmptyState } from "./EmptyState";
import { ResearchResult } from "./ResearchResult";
import type { ResearchState, ActivityStep, UIResearchReport } from "@/lib/types";
import { streamResearch } from "@/lib/api";

// ============================================================
// Input Bar
// ============================================================

interface InputBarProps {
  onSubmit: (prompt: string) => void;
  isRunning: boolean;
  disabled: boolean;
}

function InputBar({ onSubmit, isRunning, disabled }: InputBarProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, [value]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || isRunning || disabled) return;
    onSubmit(trimmed);
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      style={{
        padding: "0.875rem 1.25rem",
        background: "var(--bg-surface)",
        borderTop: "1px solid var(--border-subtle)",
        display: "flex",
        gap: "0.75rem",
        alignItems: "flex-end",
        flexShrink: 0,
      }}
    >
      <div style={{ flex: 1, position: "relative" }}>
        <textarea
          ref={textareaRef}
          id="research-input"
          className="research-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe a website you want to build... (⌘+Enter to submit)"
          disabled={isRunning || disabled}
          rows={1}
          style={{ minHeight: 44, maxHeight: 120 }}
        />
      </div>

      <button
        id="research-submit-btn"
        className="btn-primary"
        onClick={handleSubmit}
        disabled={!value.trim() || isRunning || disabled}
        style={{ height: 44, paddingLeft: "1.125rem", paddingRight: "1.125rem" }}
      >
        {isRunning ? (
          <>
            <Loader2 size={15} className="spin-slow" />
            Researching
          </>
        ) : (
          <>
            <Search size={15} />
            Research
          </>
        )}
      </button>
    </div>
  );
}

// ============================================================
// Running state / progress indicator
// ============================================================

function RunningIndicator({ activity }: { activity: ActivityStep[] }) {
  const latest = activity[activity.length - 1];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.5rem",
        padding: "3rem 2rem",
      }}
    >
      {/* Spinner ring */}
      <div style={{ position: "relative" }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            border: "2px solid var(--border-muted)",
            borderTopColor: "var(--accent)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.25rem",
          }}
        >
          🔎
        </div>
      </div>

      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-primary)", marginBottom: "0.375rem" }}>
          UI Research Agent is working
        </p>
        {latest && (
          <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
            {latest.action}
          </p>
        )}
      </div>

      {/* Progress dots */}
      <div style={{ display: "flex", gap: "0.375rem" }}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--accent)",
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ============================================================
// Error State
// ============================================================

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        padding: "3rem 2rem",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "16px",
          background: "rgba(239,68,68,0.08)",
          border: "1px solid rgba(239,68,68,0.20)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AlertCircle size={24} style={{ color: "var(--status-red)" }} />
      </div>
      <div>
        <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
          Research failed
        </p>
        <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", maxWidth: "360px", lineHeight: 1.6 }}>
          {message}
        </p>
      </div>
      <button id="retry-research-btn" className="btn-ghost" onClick={onRetry} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <RotateCcw size={13} />
        Try again
      </button>
    </motion.div>
  );
}

// ============================================================
// Workspace — main container
// ============================================================

export function Workspace({
  onActivityUpdate,
  onAgentStart,
  onAgentStop,
}: {
  onActivityUpdate: (steps: ActivityStep[]) => void;
  onAgentStart: () => void;
  onAgentStop: () => void;
}) {
  const [state, setState] = useState<ResearchState>({
    phase: "idle",
    activity: [],
    report: null,
    error: null,
    activeAgentId: null,
  });

  const [lastPrompt, setLastPrompt] = useState("");
  const stopRef = useRef<(() => void) | null>(null);

  const handleSubmit = useCallback((prompt: string) => {
    // Reset state
    const fresh: ResearchState = {
      phase: "running",
      activity: [],
      report: null,
      error: null,
      activeAgentId: "ui-research",
    };
    setState(fresh);
    setLastPrompt(prompt);
    onAgentStart();

    const stop = streamResearch(
      prompt,
      // onActivity
      (step) => {
        setState((prev) => {
          const updated = [...prev.activity, step];
          onActivityUpdate(updated);
          return { ...prev, activity: updated };
        });
      },
      // onReport
      (report) => {
        setState((prev) => ({ ...prev, report }));
      },
      // onError
      (message) => {
        setState((prev) => ({
          ...prev,
          phase: "error",
          error: message,
        }));
        onAgentStop();
      },
      // onDone
      () => {
        setState((prev) => ({
          ...prev,
          phase: "done",
          activeAgentId: null,
        }));
        onAgentStop();
      }
    );

    stopRef.current = stop;
  }, [onActivityUpdate, onAgentStart, onAgentStop]);

  const handleRetry = () => {
    if (lastPrompt) handleSubmit(lastPrompt);
  };

  const isRunning = state.phase === "running";

  return (
    <>
      {/* Title bar */}
      <div
        style={{
          padding: "0.75rem 1.25rem 0.5rem",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
          background: "var(--bg-base)",
        }}
      >
        <p className="section-label">Workspace</p>
        {state.phase === "done" && (
          <button
            id="new-research-btn"
            className="btn-ghost"
            onClick={() => {
              setState({ phase: "idle", activity: [], report: null, error: null, activeAgentId: null });
              onActivityUpdate([]);
            }}
            style={{ fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.375rem" }}
          >
            <RotateCcw size={12} />
            New research
          </button>
        )}
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 0, background: "var(--bg-base)" }}>
        <AnimatePresence mode="wait">
          {state.phase === "idle" && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ flex: 1, overflowY: "auto" }}
            >
              <EmptyState />
            </motion.div>
          )}
          {state.phase === "running" && (
            <motion.div
              key="running"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ flex: 1, display: "flex", flexDirection: "column" }}
            >
              <RunningIndicator activity={state.activity} />
            </motion.div>
          )}
          {state.phase === "done" && state.report && (
            <motion.div
              key="result"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ flex: 1, overflowY: "auto" }}
            >
              <ResearchResult report={state.report} prompt={lastPrompt} />
            </motion.div>
          )}
          {state.phase === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ flex: 1, display: "flex", flexDirection: "column" }}
            >
              <ErrorState message={state.error ?? "Unknown error"} onRetry={handleRetry} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input bar — bottom of workspace column */}
      <InputBar onSubmit={handleSubmit} isRunning={isRunning} disabled={false} />
    </>
  );
}
