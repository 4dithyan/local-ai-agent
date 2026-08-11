"use client";

import { useState, useCallback, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { AgentSidebar } from "@/components/layout/AgentSidebar";
import { ActivityPanel } from "@/components/layout/ActivityPanel";
import { Workspace } from "@/components/workspace/Workspace";
import { checkHealth, fetchAgents } from "@/lib/api";
import type { Agent, ActivityStep } from "@/lib/types";

// Static fallback agent list (used until API responds)
const FALLBACK_AGENTS: Agent[] = [
  {
    id: "ui-research",
    name: "UI Research Agent",
    emoji: "🔎",
    description: "Researches UI patterns and produces structured blueprints.",
    status: "available",
    version: "1.0.0",
  },
  { id: "designer",   name: "Design Agent",      emoji: "🎨", description: "", status: "coming_soon", version: null },
  { id: "coder",      name: "Coding Agent",       emoji: "💻", description: "", status: "coming_soon", version: null },
  { id: "tester",     name: "Testing Agent",      emoji: "🧪", description: "", status: "coming_soon", version: null },
  { id: "database",   name: "Database Agent",     emoji: "🗄",  description: "", status: "coming_soon", version: null },
  { id: "deployment", name: "Deployment Agent",   emoji: "🚀", description: "", status: "coming_soon", version: null },
];

export default function DashboardPage() {
  const [agents, setAgents] = useState<Agent[]>(FALLBACK_AGENTS);
  const [connected, setConnected] = useState(false);
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const [activity, setActivity] = useState<ActivityStep[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // Poll health + load agents on mount
  useEffect(() => {
    const poll = async () => {
      try {
        const health = await checkHealth();
        setConnected(health.ollama.connected);
      } catch {
        setConnected(false);
      }
    };

    const loadAgents = async () => {
      try {
        const data = await fetchAgents();
        setAgents(data);
      } catch {
        // keep fallback
      }
    };

    poll();
    loadAgents();

    const interval = setInterval(poll, 30_000);
    return () => clearInterval(interval);
  }, []);

  const handleActivityUpdate = useCallback((steps: ActivityStep[]) => {
    setActivity(steps);
  }, []);

  const handleAgentStart = useCallback(() => {
    setActiveAgentId("ui-research");
    setIsRunning(true);
  }, []);

  const handleAgentStop = useCallback(() => {
    setActiveAgentId(null);
    setIsRunning(false);
  }, []);

  return (
    <div className="dashboard-layout" role="main" aria-label="Agent Studio Dashboard">
      {/* Top bar */}
      <Header connected={connected} />

      {/* Body: sidebar + workspace + activity */}
      <div className="dashboard-body">
        {/* Left sidebar */}
        <AgentSidebar
          agents={agents}
          activeAgentId={activeAgentId}
          onSelectAgent={() => {
            // V2: route to other agents
          }}
        />

        {/* Center workspace column */}
        <div className="workspace-column">
          <Workspace
            onActivityUpdate={handleActivityUpdate}
            onAgentStart={handleAgentStart}
            onAgentStop={handleAgentStop}
          />
        </div>

        {/* Right activity panel */}
        <ActivityPanel activity={activity} isRunning={isRunning} />
      </div>
    </div>
  );
}
