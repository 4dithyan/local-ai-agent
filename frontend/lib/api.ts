/**
 * Backend API client.
 *
 * All communication with the FastAPI backend goes through this module.
 * Never call fetch() directly from components — use this layer.
 *
 * Base URL is read from NEXT_PUBLIC_API_URL (defaults to localhost:8000).
 */

import type { Agent, UIResearchReport, ActivityStep, SSEEvent } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

export interface HealthResponse {
  status: string;
  ollama: {
    connected: boolean;
    models: string[];
    configured_model: string;
  };
}

export async function checkHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE}/api/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
  return res.json();
}

// ---------------------------------------------------------------------------
// Agents
// ---------------------------------------------------------------------------

export async function fetchAgents(): Promise<Agent[]> {
  const res = await fetch(`${API_BASE}/api/agents`);
  if (!res.ok) throw new Error(`Failed to fetch agents: ${res.status}`);
  const data = await res.json();
  return data.agents;
}

// ---------------------------------------------------------------------------
// Research — SSE Streaming
// ---------------------------------------------------------------------------

/**
 * Stream a research request.
 *
 * Calls the SSE endpoint and invokes callbacks as events arrive.
 * Returns a cleanup function (call to abort the stream).
 *
 * Usage:
 *   const stop = streamResearch(
 *     "Create a minimal SaaS website",
 *     (step) => addActivity(step),
 *     (report) => setReport(report),
 *     (err) => setError(err),
 *     () => setDone()
 *   );
 */
export function streamResearch(
  request: string,
  onActivity: (step: ActivityStep) => void,
  onReport: (report: UIResearchReport) => void,
  onError: (message: string) => void,
  onDone: () => void
): () => void {
  const controller = new AbortController();

  (async () => {
    try {
      const res = await fetch(`${API_BASE}/api/research/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request }),
        signal: controller.signal,
      });

      if (!res.ok) {
        onError(`Server error: ${res.status}`);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        onError("No response body");
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE messages end with \n\n
        const messages = buffer.split("\n\n");
        buffer = messages.pop() ?? "";

        for (const msg of messages) {
          const line = msg.trim();
          if (!line.startsWith("data: ")) continue;

          const json = line.slice("data: ".length);
          try {
            const event: SSEEvent = JSON.parse(json);

            if (event.type === "activity") {
              onActivity(event.step);
            } else if (event.type === "report") {
              onReport(event.report);
            } else if (event.type === "error") {
              onError(event.message);
            } else if (event.type === "done") {
              onDone();
            }
          } catch {
            // Ignore malformed SSE chunks
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        onError((err as Error).message ?? "Unknown error");
      }
    }
  })();

  return () => controller.abort();
}

// ---------------------------------------------------------------------------
// Research — Non-streaming (useful for testing / fallback)
// ---------------------------------------------------------------------------

export interface ResearchResponse {
  success: boolean;
  report: UIResearchReport | null;
  error: string | null;
  activity_log: ActivityStep[];
}

export async function runResearch(request: string): Promise<ResearchResponse> {
  const res = await fetch(`${API_BASE}/api/research`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ request }),
  });
  if (!res.ok) throw new Error(`Research request failed: ${res.status}`);
  return res.json();
}
