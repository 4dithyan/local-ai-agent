# Agent Studio

A modern **AI Agent Development Dashboard** where multiple AI agents collaborate to research, design, code, test, and deploy complete websites.

> **V1** — Only the UI Research Agent is active. All other agents are designed and visible in the UI but will be implemented in future versions.

---

## Project Structure

```
local_ai_agent/
├── frontend/               # Next.js 16 dashboard (TypeScript + Tailwind v4)
│   ├── app/
│   │   ├── layout.tsx      # Root layout (fonts, metadata)
│   │   ├── page.tsx        # Main dashboard page
│   │   └── globals.css     # Design system tokens + global styles
│   ├── components/
│   │   ├── layout/         # Header, AgentSidebar, ActivityPanel
│   │   ├── workspace/      # Workspace, EmptyState, ResearchResult + section cards
│   │   └── ui/             # Reusable: StatusDot, AgentCard, LoadingState
│   ├── lib/
│   │   ├── types.ts        # Shared TypeScript types (mirrors backend Pydantic models)
│   │   └── api.ts          # Backend API client (fetch wrappers)
│   └── .env.local          # NEXT_PUBLIC_API_URL=http://localhost:8000
│
├── backend/                # Python FastAPI
│   ├── main.py             # API server (SSE streaming, WebSocket, agent registry)
│   ├── agents/
│   │   └── ui_research_agent.py   # ← UI Research Agent lives here
│   ├── llm/
│   │   └── ollama_client.py       # Ollama HTTP client (streaming + non-streaming)
│   ├── models/
│   │   └── research.py            # Pydantic models for all research types
│   ├── tools/
│   │   ├── web_search.py          # Placeholder → future DuckDuckGo/SerpAPI
│   │   ├── browser.py             # Placeholder → future Playwright (sandboxed)
│   │   └── screenshot.py          # Placeholder → future Playwright + vision
│   └── requirements.txt
│
└── README.md
```

---

## Running the Project

### 1. Start the Backend

```bash
cd backend
pip install -r requirements.txt
python main.py
# Server runs at http://localhost:8000
# API docs at http://localhost:8000/docs
```

### 2. Start the Frontend

```bash
cd frontend
npm install
npm run dev
# Dashboard  http://localhost:3000
```

### 3. Make sure Ollama is running

```bash
ollama run qwen3-vl:4b
```

---

## How the Frontend Works

The dashboard uses a **3-column grid layout**:

```
[ Agent Sidebar ] [ Workspace ] [ Activity Panel ]
```

- **Agent Sidebar** — Shows all agents (active + coming soon)
- **Workspace** — Input → Running → Result or Error state
- **Activity Panel** — Real-time stream of agent activity steps

State flow in the frontend:
1. User types a prompt and presses **Research** (or ⌘+Enter)
2. `Workspace` calls `streamResearch()` from `lib/api.ts`
3. The API client opens a streaming `fetch()` to `POST /api/research/stream`
4. Each SSE event updates the activity panel and workspace state
5. When the `report` event arrives, the full result is rendered with animated cards
6. When `done` fires, the agent status resets to idle

---

## How the Backend Connects

```
Next.js Dashboard
       │
       │ POST /api/research/stream  (SSE)
       ▼
FastAPI (backend/main.py)
       │
       ▼
UI Research Agent (backend/agents/ui_research_agent.py)
       │
       │ POST /api/generate
       ▼
Ollama HTTP API (localhost:11434)
       │
       ▼
Qwen3-VL 4B
```

The SSE stream sends these event types:
- `{"type": "activity", "step": {...}}` — one step at a time as the agent progresses
- `{"type": "report", "report": {...}}` — the complete structured result
- `{"type": "done"}` — signals completion

---

## How Ollama / Qwen3-VL Connects

The Ollama client is in `backend/llm/ollama_client.py`.

It calls `http://localhost:11434/api/generate` with:
- **Model**: `qwen3-vl:4b` (configurable via `OLLAMA_MODEL` env var)
- **System prompt**: The full UI Research Agent persona + JSON output schema
- **Temperature**: 0.3 (for structured, consistent output)

To use a different model:
```bash
# In backend/.env or shell
export OLLAMA_MODEL=qwen2.5:7b
```

---

## Where the UI Research Agent Logic Lives

```
backend/agents/ui_research_agent.py
```

Key functions:
- `SYSTEM_PROMPT` — The agent's full persona, knowledge, and JSON output schema
- `run(request)` — Async generator that yields `ActivityStep` objects and embeds the final `UIResearchReport`
- `_extract_json()` — Extracts valid JSON from the LLM response (handles markdown fences)
- `_parse_report()` — Converts raw dict → typed Pydantic `UIResearchReport`

---

## How to Add Agent #2 (Designer Agent)

1. **Create the agent file**:
   ```
   backend/agents/designer_agent.py
   ```
   Copy the pattern from `ui_research_agent.py` — define `SYSTEM_PROMPT`, `run()`, and output models.

2. **Add Pydantic models** in `backend/models/research.py`:
   ```python
   class DesignSystemReport(BaseModel):
       ...
   ```

3. **Add the API endpoint** in `backend/main.py`:
   ```python
   @app.post("/api/design/stream")
   async def design_stream(request: DesignRequest):
       ...
   ```

4. **Update the agent registry** in `backend/main.py`:
   Change `"status": "coming_soon"` → `"status": "available"` for the designer entry.

5. **Add frontend types** in `frontend/lib/types.ts`:
   Mirror your new Pydantic models as TypeScript interfaces.

6. **Add result cards** in `frontend/components/workspace/sections/`:
   Create a `DesignResultCard.tsx` following the existing card pattern.

The frontend already calls `GET /api/agents` on load to update the sidebar — no other wiring needed.

---

## Environment Variables

### Backend
| Variable | Default | Description |
|---|---|---|
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama server URL |
| `OLLAMA_MODEL` | `qwen3-vl:4b` | Model to use |

### Frontend
| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | FastAPI backend URL |

---

## Security Notes

- The browser tool (`backend/tools/browser.py`) is a **placeholder only**
- When implemented, it will use an **isolated Playwright profile** — never the user's personal Chrome
- The agent has no access to your files, passwords, or personal accounts
- All tool implementations will go through a controlled, sandboxed layer

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | Next.js 16 |
| Frontend language | TypeScript |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion |
| Icons | Lucide React |
| Backend framework | FastAPI |
| Backend language | Python |
| LLM runtime | Ollama |
| LLM model | Qwen3-VL 4B |
| Streaming | SSE (Server-Sent Events) |
