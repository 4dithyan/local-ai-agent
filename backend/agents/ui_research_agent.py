"""
UI Research Agent — V1

Architecture:
    Agent
     ├── LLM  (Qwen3-VL 4B via Ollama)
     ├── System Prompt  (see SYSTEM_PROMPT below)
     ├── Tools  (web_search, browser, screenshot — stubs in V1)
     ├── Memory  (conversation context, not persistent in V1)
     └── Structured Output  (UIResearchReport via JSON parsing)

The agent's job is NOT to chat. Its job is:
    Research → Analyze → Compare → Recommend → Structure

It takes a user's website description and produces a full UIResearchReport.
"""

import json
import re
import uuid
from datetime import datetime, timezone
from typing import AsyncGenerator

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
# System Prompt
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """You are the UI Research Agent — a specialist AI that analyzes website requirements
and produces structured UI blueprints.

Your job is NOT to chat. Your job is:
  Research → Analyze → Compare → Recommend → Structure

You have deep knowledge of:

DESIGN
- Modern SaaS, portfolio, editorial, bento, minimal, futuristic interfaces
- Glassmorphism, typography, responsive layouts
- Navigation patterns, hero sections, cards, dashboards, landing pages

ANIMATION (conceptual scale 0–10)
- GSAP, Framer Motion, Motion (formerly Popmotion), CSS animations
- Scroll animations, parallax, page transitions, hover interactions
- Micro-interactions, magnetic buttons, cursor effects, smooth scrolling, Lenis
- Default recommendation: 4/10 (subtle modern) unless user requests otherwise

3D / GRAPHICS
- Three.js, React Three Fiber, WebGL, shaders
- Interactive 3D, lightweight hero elements, 3D product visualization

PERFORMANCE
- Mobile performance, low-end devices, GPU usage, animation performance
- Bundle size, lazy loading, accessibility, prefers-reduced-motion

DECISION PHILOSOPHY
- Do NOT recommend the most complicated technology
- Recommend the best visual result for the requirements while keeping implementation practical and performant
- Actively avoid: excessive particles, unnecessary 3D, constant movement, excessive cursor effects,
  huge page transitions, animation everywhere, poor mobile performance, visual clutter
- Ideal result feels: premium + modern + intentional + subtle

OUTPUT FORMAT
You MUST respond with a single valid JSON object matching this exact structure.
No markdown fences. No extra text before or after. Just the JSON.

{
  "project_summary": "string",
  "visual_direction": {
    "style": "string",
    "confidence": 0-100,
    "description": "string"
  },
  "color_system": {
    "palette": "string",
    "primary": "string (hex)",
    "accent": "string (hex)",
    "background": "string (hex)",
    "description": "string"
  },
  "typography": {
    "primary_font": "string",
    "code_font": "string or null",
    "scale": "string",
    "description": "string"
  },
  "animation_strategy": {
    "intensity": 0-10,
    "intensity_label": "string",
    "tools": [
      {"name": "string", "recommendation": "recommended|selective|avoid", "reason": "string"}
    ],
    "scroll_behavior": "string",
    "description": "string"
  },
  "three_d_strategy": {
    "use_3d": true|false,
    "library": "string or null",
    "complexity": "none|low|medium|high",
    "scope": "string",
    "performance_rating": "good|moderate|heavy",
    "description": "string"
  },
  "tech_stack": [
    {"category": "string", "name": "string", "version_hint": "string", "reason": "string"}
  ],
  "performance_strategy": {
    "mobile_ready": true|false,
    "reduced_motion_support": true|false,
    "lazy_loading": true|false,
    "bundle_strategy": "string",
    "description": "string"
  },
  "navigation_pattern": "string",
  "hero_section": "string",
  "content_layout": "string",
  "mobile_strategy": "string",
  "accessibility_strategy": "string",
  "avoid": [
    {"item": "string", "reason": "string"}
  ],
  "final_blueprint": "string (multi-line summary)"
}
"""

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
    Handles cases where the model wraps output in markdown fences.
    """
    # Try direct parse first
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Strip markdown fences if present
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

    typo_data = data["typography"]
    typo = TypographySystem(**typo_data)

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
# Main agent runner — yields ActivitySteps, final step contains the report
# ---------------------------------------------------------------------------

async def run(request: UIResearchRequest) -> AsyncGenerator[ActivityStep, None]:
    """
    Run the UI Research Agent.

    Yields ActivityStep objects as the agent progresses.
    The final ActivityStep has status="done" and the report embedded
    in a non-standard field (see the FastAPI endpoint for how to capture it).

    Usage:
        async for step in run(request):
            emit_to_client(step)
    """

    steps = [
        "Understanding your request",
        "Analyzing visual requirements",
        "Researching modern UI patterns",
        "Researching animation libraries",
        "Researching 3D technologies",
        "Evaluating options against requirements",
        "Generating UI blueprint",
    ]

    for step_text in steps:
        yield _activity(step_text, status="running")

    # Build the prompt
    user_prompt = f"""Analyze the following website request and produce a complete UI research report as JSON:

USER REQUEST:
"{request.request}"

Remember:
- Default animation intensity is 4/10 (subtle modern) unless explicitly requested otherwise
- Recommend practical, performant solutions — not the most complex
- Output ONLY the JSON object, no other text
"""

    raw_response = ""
    try:
        raw_response = await ollama_client.generate(
            prompt=user_prompt,
            system=SYSTEM_PROMPT,
            temperature=0.3,
        )
    except Exception as e:
        yield _activity(f"Error contacting Ollama: {e}", status="error")
        return

    # Parse
    try:
        data = _extract_json(raw_response)
        report = _parse_report(data)
    except Exception as e:
        yield _activity(f"Error parsing agent response: {e}", status="error")
        # Attach raw response for debugging
        yield _activity(f"Raw LLM output (first 500 chars): {raw_response[:500]}", status="error")
        return

    # Signal done — we attach the report as a special attribute
    done_step = _activity("Research complete — UI blueprint ready", status="done")
    # We use model_extra to sneak the report through the activity stream
    # The FastAPI endpoint will look for this
    done_step.__dict__["_report"] = report
    yield done_step
