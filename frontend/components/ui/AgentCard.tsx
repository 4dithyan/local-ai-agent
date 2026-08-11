"use client";

import { motion } from "framer-motion";
import { StatusDot } from "@/components/ui/StatusDot";
import type { Agent, AgentStatus } from "@/lib/types";

interface AgentCardProps {
  agent: Agent;
  isActive: boolean;
  onClick?: () => void;
}

function getDotStatus(
  agentStatus: AgentStatus,
  isActive: boolean
): "active" | "working" | "idle" | "error" {
  if (isActive && agentStatus === "available") return "working";
  if (agentStatus === "available") return "active";
  return "idle";
}

export function AgentCard({ agent, isActive, onClick }: AgentCardProps) {
  const isAvailable = agent.status === "available";
  const dotStatus = getDotStatus(agent.status, isActive);

  return (
    <motion.div
      className={`agent-item ${isActive ? "agent-item-active" : "agent-item-inactive"}`}
      onClick={isAvailable ? onClick : undefined}
      whileHover={isAvailable ? { x: 2 } : {}}
      whileTap={isAvailable ? { scale: 0.98 } : {}}
      style={{ cursor: isAvailable ? "pointer" : "default" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
        {/* Emoji */}
        <span style={{ fontSize: "1rem", lineHeight: 1, opacity: isAvailable ? 1 : 0.4 }}>
          {agent.emoji}
        </span>

        {/* Name + status */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: "0.8125rem",
              fontWeight: 500,
              color: isAvailable ? "var(--text-primary)" : "var(--text-muted)",
              lineHeight: 1.3,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {agent.name}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
              marginTop: "0.25rem",
            }}
          >
            <StatusDot status={dotStatus} size="sm" />
            <span
              style={{
                fontSize: "0.6875rem",
                color: isActive ? "var(--accent-light)" : isAvailable ? "var(--status-green)" : "var(--text-muted)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {isActive
                ? "Working"
                : isAvailable
                ? "Available"
                : "Coming soon"}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
