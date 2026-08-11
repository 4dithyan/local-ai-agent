"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AgentCard } from "@/components/ui/AgentCard";
import type { Agent } from "@/lib/types";

interface AgentSidebarProps {
  agents: Agent[];
  activeAgentId: string | null;
  onSelectAgent?: (agentId: string) => void;
}

export function AgentSidebar({
  agents,
  activeAgentId,
  onSelectAgent,
}: AgentSidebarProps) {
  const available = agents.filter((a) => a.status === "available");
  const future = agents.filter((a) => a.status === "coming_soon");

  return (
    <aside
      style={{
        background: "var(--bg-surface)",
        borderRight: "1px solid var(--border-subtle)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Agents header */}
      <div
        style={{
          padding: "1rem 1rem 0.5rem",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <p className="section-label">Agents</p>
      </div>

      {/* Scrollable agent list */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "2px",
        }}
      >
        {/* Active agents */}
        {available.length > 0 && (
          <div style={{ marginBottom: "0.5rem" }}>
            {available.map((agent, i) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <AgentCard
                  agent={agent}
                  isActive={activeAgentId === agent.id}
                  onClick={() => onSelectAgent?.(agent.id)}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* Divider */}
        {future.length > 0 && (
          <div
            style={{
              padding: "0.5rem 0.5rem 0.25rem",
              marginTop: "0.25rem",
            }}
          >
            <p className="section-label">Coming Soon</p>
          </div>
        )}

        {/* Future agents */}
        {future.map((agent, i) => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: (available.length + i) * 0.05 }}
          >
            <AgentCard
              agent={agent}
              isActive={false}
            />
          </motion.div>
        ))}
      </div>

      {/* Footer info */}
      <div
        style={{
          padding: "0.75rem 1rem",
          borderTop: "1px solid var(--border-subtle)",
        }}
      >
        <p
          style={{
            fontSize: "0.6875rem",
            color: "var(--text-muted)",
            fontFamily: "var(--font-mono)",
            lineHeight: 1.5,
          }}
        >
          1 / {agents.length} agents
          <br />
          <span style={{ color: "var(--accent-light)" }}>active</span>
        </p>
      </div>
    </aside>
  );
}
