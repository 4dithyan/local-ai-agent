"""
UI Research Agent — V1

Architecture:
    Agent
     ├── LLM  (Qwen3-VL 4B via Ollama)
     ├── System Prompt  (compact — reduces prefill time on slow hardware)
     ├── Tools  (web_search, browser, screenshot — stubs in V1)
     ├── Memory  (conversation context, not persistent in V1)
     └── Structured Output  (UIResearchReport via JSON parsing)

The agent's job is NOT to chat. Its job is:
    Research → Analyze → Compare → Recommend → Structure

IMPORTANT: Uses streaming generate so the request never hits a read timeout,
even on slow local hardware. Tokens arrive continuously, keeping the connection alive.
"""

import json
import re
import uuid
from datetime import datetime, timezone
from typing import AsyncGenerator

import httpx

from models.research import (
    ActivityStep,
    AnimationStrategy,
    AnimationTool,
    AvoidItem,
    ColorSystem,
    PerformanceStrategy,
    ThreeDStrategy,
    TechStackItem,
    TypographySystem,
    UIResearchReport,
    UIResearchRequest,
    VisualDirection,
)
from llm import ollama_client

# ---------------------------------------------------------------------------
# System Prompt — kept compact to reduce prefill time on slow local models
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """You are the UI Research Agent. Analyze website requirements and output a UI blueprint as JSON.

KNOWLEDGE: Modern SaaS/portfolio/futuristic UI design, GSAP/Framer Motion/Lenis animation, Three.js/React Three Fiber 3D, mobile performance, accessibility.

PHILOSOPHY:
- Default animation intensity: 4/10 (subtle modern). Only go higher if user asks.
- Avoid: excessive particles, unnecessary 3D, constant motion, heavy WebGL backgrounds.
- Goal: premium + modern + intentional + subtle.

OUTPUT: Respond with ONLY a valid JSON object. No markdown fences. No explanation. Just JSON.

JSON STRUCTURE:
{
  "project_summary": "one sentence",
  "visual_direction": {"style": "...", "confidence": 85, "description": "..."},
  "color_system": {"palette": "...", "primary": "#hex", "accent": "#hex", "background": "#hex", "description": "..."},
  "typography": {"primary_font": "Inter", "code_font": null, "scale": "...", "description": "..."},
  "animation_strategy": {
    "intensity": 4, "intensity_label": "Subtle Modern",
    "tools": [{"name": "Framer Motion", "recommendation": "recommended", "reason": "..."}],
    "scroll_behavior": "...", "description": "..."
  },
  "three_d_strategy": {"use_3d": false, "library": null, "complexity": "none", "scope": "none", "performance_rating": "good", "description": "..."},
  "tech_stack": [{"category": "Framework", "name": "Next.js", "version_hint": "latest", "reason": "..."}],
  "performance_strategy": {"mobile_ready": true, "reduced_motion_support": true, "lazy_loading": true, "bundle_strategy": "...", "description": "..."},
  "navigation_pattern": "...",
  "hero_section": "...",
  "content_layout": "...",
  "mobile_strategy": "...",
  "accessibility_strategy": "...",
  "avoid": [{"item": "...", "reason": "..."}],
  "final_blueprint": "multi-line summary"
}"""

# ---------------------------------------------------------------------------
# Activity helper
# ---------------------------------------------------------------------------

def _activity(action: str, status: str = "running", agent: str = "UI Research Agent") -> ActivityStep:
    return ActivityStep(
        id=str(uuid.uuid4()),
        timestamp=datetime.now(timezone.utc).isoformat(),
        agent=agent,
        action=action,
        status=status,
    )


# ---------------------------------------------------------------------------
# JSON extraction from LLM output
# ---------------------------------------------------------------------------

def _extract_json(text: str) -> dict:
    """
    Extract the first valid JSON object from an LLM response.
    Handles markdown fences, thinking tags, and leading/trailing text.
    """
    text = text.strip()

    # Remove Qwen3 thinking block if present (<think>...</think>)
    text = re.sub(r"<think>[\s\S]*?</think>", "", text, flags=re.IGNORECASE).strip()

    # Try direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Strip markdown fences
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"\s*```$", "", text, flags=re.MULTILINE)
    try:
        return json.loads(text.strip())
    except json.JSONDecodeError:
        pass

    # Find the first {...} block
    match = re.search(r"\{[\s\S]*\}", text)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    raise ValueError("Could not extract valid JSON from LLM response")


# ---------------------------------------------------------------------------
# Report parser
# ---------------------------------------------------------------------------

def _parse_report(data: dict) -> UIResearchReport:
    """Convert raw LLM JSON dict into a typed UIResearchReport."""

    visual = VisualDirection(**data["visual_direction"])
    color = ColorSystem(**data["color_system"])
    typo = TypographySystem(**data["typography"])

    anim_data = data["animation_strategy"]
    tools = [AnimationTool(**t) for t in anim_data.get("tools", [])]
    anim = AnimationStrategy(
        intensity=anim_data["intensity"],
        intensity_label=anim_data["intensity_label"],
        tools=tools,
        scroll_behavior=anim_data["scroll_behavior"],
        description=anim_data["description"],
    )

    three_d = ThreeDStrategy(**data["three_d_strategy"])
    tech = [TechStackItem(**t) for t in data.get("tech_stack", [])]
    perf = PerformanceStrategy(**data["performance_strategy"])
    avoid = [AvoidItem(**a) for a in data.get("avoid", [])]

    return UIResearchReport(
        project_summary=data["project_summary"],
        visual_direction=visual,
        color_system=color,
        typography=typo,
        animation_strategy=anim,
        three_d_strategy=three_d,
        tech_stack=tech,
        performance_strategy=perf,
        navigation_pattern=data["navigation_pattern"],
        hero_section=data["hero_section"],
        content_layout=data["content_layout"],
        mobile_strategy=data["mobile_strategy"],
        accessibility_strategy=data["accessibility_strategy"],
        avoid=avoid,
        final_blueprint=data["final_blueprint"],
    )


# ---------------------------------------------------------------------------
# Main agent runner — uses STREAMING to avoid read timeouts on slow hardware
# ---------------------------------------------------------------------------

async def run(request: UIResearchRequest) -> AsyncGenerator[ActivityStep, None]:
    """
    Run the UI Research Agent.

    Uses streaming generation so the connection stays alive even on slow
    local hardware — no read timeout since tokens arrive continuously.

    Yields ActivityStep objects as the agent progresses.
    The final ActivityStep has status="done" with _report attached.
    """

    activity_steps = [
        "Understanding your request",
        "Analyzing visual requirements",
        "Researching modern UI patterns",
        "Researching animation libraries",
        "Researching 3D technologies",
        "Evaluating options against requirements",
        "Generating UI blueprint",
    ]

    for step_text in activity_steps:
        yield _activity(step_text, status="running")

    user_prompt = (
        f'Analyze this website request and output the JSON blueprint:\n\n"{request.request}"\n\n'
        "Output ONLY the JSON. Default animation intensity is 4/10 unless user asks for more."
    )

    # ── Stream the response (avoids read timeouts on slow machines) ──────────
    raw_tokens: list[str] = []
    token_count = 0

    yield _activity("Model is generating response… (this may take 1-3 minutes on local hardware)", status="running")

    try:
        async for token in ollama_client.generate_stream(
            prompt=user_prompt,
            system=SYSTEM_PROMPT,
            temperature=0.3,
        ):
            raw_tokens.append(token)
            token_count += 1

    except httpx.ConnectError as e:
        yield _activity(
            f"Cannot connect to Ollama at {ollama_client.OLLAMA_BASE_URL} — is it running? ({type(e).__name__})",
            status="error",
        )
        return
    except httpx.TimeoutException as e:
        yield _activity(
            f"Ollama stream timed out ({type(e).__name__}) — try restarting Ollama",
            status="error",
        )
        return
    except httpx.HTTPStatusError as e:
        yield _activity(
            f"Ollama returned HTTP {e.response.status_code}: {e.response.text[:200]}",
            status="error",
        )
        return
    except Exception as e:
        err_msg = str(e) or repr(e)
        yield _activity(f"Ollama error ({type(e).__name__}): {err_msg}", status="error")
        return

    raw_response = "".join(raw_tokens)

    if not raw_response.strip():
        yield _activity("Model returned an empty response — try running the request again", status="error")
        return

    yield _activity(f"Received response ({token_count} tokens) — parsing blueprint…", status="running")

    # ── Parse structured output ──────────────────────────────────────────────
    try:
        data = _extract_json(raw_response)
        report = _parse_report(data)
    except Exception as e:
        yield _activity(f"Error parsing agent response: {e}", status="error")
        yield _activity(f"Raw output (first 300 chars): {raw_response[:300]}", status="error")
        return

    # ── Done — attach the report to the final activity step ─────────────────
    done_step = _activity("Research complete — UI blueprint ready", status="done")
    done_step.__dict__["_report"] = report
    yield done_step
