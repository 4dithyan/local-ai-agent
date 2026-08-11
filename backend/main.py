"""
Agent Studio — FastAPI Backend
================================
Main entry point for the backend server.

Endpoints:
  GET  /api/health          — Health check + Ollama status
  GET  /api/agents          — Agent registry
  POST /api/research/stream — SSE stream of activity steps + final report
  POST /api/research        — Non-streaming research (simple, for testing)

WebSocket /ws/activity      — Prepared for real-time multi-agent streaming (V2)

Run with:
  uvicorn main:app --reload --port 8000
"""

import json
import sys
import os

# Allow imports from parent directory (backend root)
sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from models.research import UIResearchRequest, UIResearchResponse, ActivityStep
from agents import ui_research_agent
from llm import ollama_client

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Agent Studio API",
    description="Backend for the Agent Studio AI Development Dashboard",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Agent Registry
# ---------------------------------------------------------------------------

AGENT_REGISTRY = [
    {
        "id": "ui-research",
        "name": "UI Research Agent",
        "emoji": "🔎",
        "description": "Researches UI patterns, animation libraries, and 3D technologies to produce a structured UI blueprint.",
        "status": "available",
        "version": "1.0.0",
    },
    {
        "id": "designer",
        "name": "Design Agent",
        "emoji": "🎨",
        "description": "Translates the UI blueprint into a complete design system.",
        "status": "coming_soon",
        "version": None,
    },
    {
        "id": "coder",
        "name": "Coding Agent",
        "emoji": "💻",
        "description": "Implements the design in code.",
        "status": "coming_soon",
        "version": None,
    },
    {
        "id": "tester",
        "name": "Testing Agent",
        "emoji": "🧪",
        "description": "Tests the implemented website for quality and accessibility.",
        "status": "coming_soon",
        "version": None,
    },
    {
        "id": "database",
        "name": "Database Agent",
        "emoji": "🗄",
        "description": "Designs and connects the database layer.",
        "status": "coming_soon",
        "version": None,
    },
    {
        "id": "deployment",
        "name": "Deployment Agent",
        "emoji": "🚀",
        "description": "Deploys the complete website to production.",
        "status": "coming_soon",
        "version": None,
    },
]

# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@app.get("/api/health")
async def health():
    ollama_ok = await ollama_client.check_connection()
    models = await ollama_client.list_models() if ollama_ok else []
    return {
        "status": "ok",
        "ollama": {
            "connected": ollama_ok,
            "models": models,
            "configured_model": ollama_client.OLLAMA_MODEL,
        },
    }

# ---------------------------------------------------------------------------
# Agent Registry
# ---------------------------------------------------------------------------

@app.get("/api/agents")
async def get_agents():
    return {"agents": AGENT_REGISTRY}

# ---------------------------------------------------------------------------
# Research — SSE Streaming
# ---------------------------------------------------------------------------

async def _research_event_generator(request: UIResearchRequest):
    """
    Async generator that yields SSE-formatted events.
    Events:
      data: {"type": "activity", "step": {...}}
      data: {"type": "report", "report": {...}}
      data: {"type": "error", "message": "..."}
      data: {"type": "done"}
    """
    report = None

    async for step in ui_research_agent.run(request):
        # Check if this step carries a report (done step)
        embedded_report = step.__dict__.get("_report")

        step_data = step.model_dump()
        payload = json.dumps({"type": "activity", "step": step_data})
        yield f"data: {payload}\n\n"

        if embedded_report is not None:
            report = embedded_report

    if report is not None:
        report_payload = json.dumps({
            "type": "report",
            "report": report.model_dump(),
        })
        yield f"data: {report_payload}\n\n"

    yield f"data: {json.dumps({'type': 'done'})}\n\n"


@app.post("/api/research/stream")
async def research_stream(request: UIResearchRequest):
    """
    SSE endpoint — streams activity steps then the final report.
    Frontend consumes this with EventSource or fetch+ReadableStream.
    """
    return StreamingResponse(
        _research_event_generator(request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )

# ---------------------------------------------------------------------------
# Research — Non-streaming (simple, for testing)
# ---------------------------------------------------------------------------

@app.post("/api/research", response_model=UIResearchResponse)
async def research(request: UIResearchRequest):
    """
    Non-streaming research endpoint.
    Runs the full agent and returns the complete report in one response.
    """
    activity_log = []
    report = None

    async for step in ui_research_agent.run(request):
        embedded_report = step.__dict__.get("_report")
        activity_log.append(step)
        if embedded_report is not None:
            report = embedded_report

    if report is None:
        return UIResearchResponse(
            success=False,
            error="Agent did not produce a report",
            activity_log=activity_log,
        )

    return UIResearchResponse(
        success=True,
        report=report,
        activity_log=activity_log,
    )

# ---------------------------------------------------------------------------
# WebSocket — prepared for V2 multi-agent streaming
# ---------------------------------------------------------------------------

@app.websocket("/ws/activity")
async def websocket_activity(websocket: WebSocket):
    """
    WebSocket endpoint for future real-time multi-agent activity streaming.
    V1: Accepts connection and sends a welcome message.
    V2: Will broadcast activity from all running agents.
    """
    await websocket.accept()
    try:
        await websocket.send_json({
            "type": "connected",
            "message": "Agent Studio WebSocket connected. Multi-agent streaming coming in V2.",
        })
        while True:
            data = await websocket.receive_text()
            await websocket.send_json({"type": "echo", "message": data})
    except WebSocketDisconnect:
        pass

# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
