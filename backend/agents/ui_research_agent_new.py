"""
UI Research Agent — V2 (Real Web Research + Python Validation)
"""

import json
import re
import uuid
import logging
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
    ResearchSource,
    ResearchFinding,
    TechnologyComparison,
    ResearchEvidence
)
from llm import ollama_client
from tools.web_search import search_web
from tools.browser import read_page

logger = logging.getLogger(__name__)

def _activity(action: str, status: str = "running", agent: str = "UI Research Agent") -> ActivityStep:
    return ActivityStep(
        id=str(uuid.uuid4()),
        timestamp=datetime.now(timezone.utc).isoformat(),
        agent=agent,
        action=action,
        status=status,
    )

def _extract_json(text: str) -> dict:
    text = text.strip()
    text = re.sub(r"<think>[\s\S]*?</think>", "", text, flags=re.IGNORECASE).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"\s*```$", "", text, flags=re.MULTILINE)
    try:
        return json.loads(text.strip())
    except json.JSONDecodeError:
        pass
    match = re.search(r"\{[\s\S]*\}", text)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass
    raise ValueError("Could not extract valid JSON from LLM response")

async def _call_llm_json(prompt: str, system: str, retries: int = 2) -> dict:
    for attempt in range(retries):
        try:
            raw_response = ""
            async for token in ollama_client.generate_stream(prompt=prompt, system=system, temperature=0.3):
                raw_response += token
            return _extract_json(raw_response)
        except Exception as e:
            if attempt == retries - 1:
                if "Could not extract valid JSON" in str(e):
                    raise ValueError(f"Could not extract valid JSON. Raw output was: {repr(raw_response)}")
                raise e

def _validate_and_repair_blueprint(report_data: dict) -> dict:
    """Python validation rules to fix contradictions in the blueprint."""
    # 1. 3D Rule
    three_d = report_data.get("three_d_strategy", {})
    use_3d = three_d.get("use_3d", False)
    
    hero = report_data.get("hero_section", "").lower()
    content = report_data.get("content_layout", "").lower()
    
    if not use_3d:
        # Strip 3D mentions if 3D is disabled
        if "3d" in hero:
            report_data["hero_section"] = "Full-width gradient background with subtle CSS depth effects, soft layered gradients and restrained parallax."
        if "three.js" in content or "react three fiber" in content:
            report_data["content_layout"] = "Clean 2D content layout focusing on typography and spacing."
            
        # Remove 3D libraries from tech stack
        new_tech = []
        for t in report_data.get("tech_stack", []):
            if "three" not in t.get("name", "").lower() and "webgl" not in t.get("name", "").lower():
                new_tech.append(t)
        report_data["tech_stack"] = new_tech
    else:
        # If 3D is used, ensure a library is mentioned
        libs = [t.get("name", "").lower() for t in report_data.get("tech_stack", [])]
        if not any("three" in l for l in libs) and not any("webgl" in l for l in libs):
            three_d["library"] = "React Three Fiber"
            report_data["tech_stack"].append({
                "category": "3D",
                "name": "React Three Fiber",
                "recommendation": "recommended",
                "reason": "Standard modern library for 3D in React."
            })

    # 2. Animation Intensity Rule
    anim = report_data.get("animation_strategy", {})
    intensity = anim.get("intensity", 5)
    if intensity <= 4 and "excessive" in anim.get("intensity_label", "").lower():
        anim["intensity_label"] = "Subtle Modern"
        
    return report_data

async def run(request: UIResearchRequest) -> AsyncGenerator[ActivityStep, None]:
    yield _activity("Understanding requirements", status="running")
    
    # ---------------------------------------------------------
    # STAGE 1: RESEARCH PLANNING
    # ---------------------------------------------------------
    PLANNING_PROMPT = f"""Analyze this request: "{request.request}"
Generate 2-3 web search queries to find the best modern UI patterns for this.
Output ONLY JSON in this format: {{"research_topics": ["query 1", "query 2"]}}
Do not write any other text. Do not use markdown. Start directly with {{"""

    queries = []
    try:
        plan_data = await _call_llm_json(PLANNING_PROMPT, system="You are a machine that outputs ONLY raw JSON. No explanations.")
        queries = plan_data.get("research_topics", plan_data.get("queries", []))[:3]
    except Exception as e:
        yield _activity(f"Failed to plan research ({e}).", status="error")

    # ---------------------------------------------------------
    # STAGE 2: WEB SEARCH & READ
    # ---------------------------------------------------------
    all_results = []
    read_sources = []
    research_status = "not_started"
    research_error = None
    
    if queries:
        research_status = "searching"
        yield _activity(f"Research plan created: {len(queries)} topics", status="running")
        
        for q in queries:
            yield _activity(f"Searching: '{q}'", status="running")
            try:
                res_json = await search_web(q, num_results=3)
                res_data = json.loads(res_json)
                if res_data.get("results"):
                    all_results.extend(res_data["results"])
            except Exception as e:
                logger.error(f"Search failed for '{q}': {e}")
                research_error = f"Search provider returned an error: {e}"

        # Deduplicate
        seen_urls = set()
        unique_results = []
        for r in all_results:
            if r["url"] not in seen_urls:
                seen_urls.add(r["url"])
                unique_results.append(r)

        if not unique_results:
            research_status = "offline_fallback"
            if not research_error:
                research_error = "No web sources available"
            yield _activity(f"WEB RESEARCH FAILED. Reason: {research_error}. Falling back to offline model knowledge.", status="error")
        else:
            research_status = "reading"
            urls_to_read = unique_results[:3]
            yield _activity(f"Evaluating {len(urls_to_read)} highly relevant sources...", status="running")
            
            for r in urls_to_read:
                yield _activity(f"Opening source: {r['title'][:30]}...", status="running")
                try:
                    content = await read_page(r["url"])
                    read_sources.append({
                        "title": r["title"],
                        "url": r["url"],
                        "snippet": r["snippet"],
                        "content": content[:2000],
                        "type": "Official Documentation" if ("docs" in r["url"] or "github" in r["url"]) else "Article",
                        "status": "read"
                    })
                except Exception as e:
                    logger.warning(f"Failed to read {r['url']}: {e}")
                    read_sources.append({
                        "title": r["title"],
                        "url": r["url"],
                        "snippet": r["snippet"],
                        "type": "Unknown",
                        "status": "failed"
                    })
            
            if any(s["status"] == "read" for s in read_sources):
                research_status = "completed"
                yield _activity(f"Sources analyzed: {len([s for s in read_sources if s['status'] == 'read'])}", status="running")
            else:
                research_status = "offline_fallback"
                research_error = "Could not read any page content"
                yield _activity(f"WEB RESEARCH FAILED. Reason: {research_error}. Falling back to offline model knowledge.", status="error")
    else:
        research_status = "offline_fallback"
        research_error = "Failed to generate search queries"
        yield _activity("Proceeding in OFFLINE mode.", status="running")

    # ---------------------------------------------------------
    # STAGE 3: SYNTHESIS (QWEN)
    # ---------------------------------------------------------
    yield _activity("Comparing options and generating recommendations", status="running")
    
    research_context = "OFFLINE RESULT - Use your baseline knowledge."
    if research_status == "completed" and read_sources:
        research_context = "EVIDENCE FOUND:\n"
        for i, s in enumerate(read_sources):
            if s["status"] == "read":
                research_context += f"Source: {s['title']} ({s['url']})\n{s['content']}\n\n"

    SYNTHESIS_SYSTEM = """You are a UI Architect.
Output a SIMPLE JSON object. Do not include research logs or version numbers.
JSON FORMAT:
{
  "project_summary": "one sentence",
  "visual_direction": {"style": "...", "confidence": 85, "description": "..."},
  "color_system": {"palette": "...", "primary": "#hex", "accent": "#hex", "background": "#hex", "description": "..."},
  "typography": {"primary_font": "Inter", "code_font": null, "scale": "...", "description": "..."},
  "animation_strategy": {
    "intensity": 4, "intensity_label": "Subtle",
    "tools": [{"name": "Framer Motion", "recommendation": "recommended", "reason": "..."}],
    "scroll_behavior": "...", "description": "..."
  },
  "three_d_strategy": {"use_3d": false, "complexity": "none", "scope": "none", "performance_rating": "good", "description": "..."},
  "tech_stack": [
    {"category": "Framework", "name": "Next.js", "reason": "..."}
  ],
  "technology_comparisons": [
    {"technology": "GSAP", "recommendation": "selective", "reason": "..."}
  ],
  "performance_strategy": {"mobile_ready": true, "reduced_motion_support": true, "lazy_loading": true, "bundle_strategy": "...", "description": "..."},
  "navigation_pattern": "...",
  "hero_section": "...",
  "content_layout": "...",
  "mobile_strategy": "...",
  "accessibility_strategy": "...",
  "avoid": [{"item": "...", "reason": "..."}],
  "final_blueprint_text": "short summary"
}
Output ONLY raw JSON."""

    SYNTHESIS_PROMPT = f'USER REQUEST: "{request.request}"\n\n{research_context}'
    
    yield _activity("Model is generating final blueprint...", status="running")
    
    try:
        raw_data = await _call_llm_json(SYNTHESIS_PROMPT, system=SYNTHESIS_SYSTEM, retries=2)
    except Exception as e:
        yield _activity(f"Error generating blueprint: {e}", status="error")
        return

    # ---------------------------------------------------------
    # STAGE 4: VALIDATION & BLUEPRINT ASSEMBLY (PYTHON)
    # ---------------------------------------------------------
    yield _activity("Validating blueprint consistency", status="running")
    
    validated_data = _validate_and_repair_blueprint(raw_data)
    
    # Construct verified TechStackItem array
    current_time = datetime.now(timezone.utc).isoformat()
    tech_stack = []
    for t in validated_data.get("tech_stack", []):
        tech_stack.append(TechStackItem(
            category=t.get("category", "Tool"),
            name=t.get("name", ""),
            version="verified" if research_status == "completed" else "not_verified",
            verified_from=read_sources[0]["url"] if research_status == "completed" and read_sources else None,
            verified_at=current_time if research_status == "completed" else None,
            reason=t.get("reason", "")
        ))

    # Construct Research Evidence
    evidence = ResearchEvidence(
        status=research_status,
        error=research_error,
        queries=queries,
        sources=[ResearchSource(title=s["title"], url=s["url"], type=s["type"], status=s["status"]) for s in read_sources],
        findings=[],  # Can be populated by parsing reasoning
        technology_comparisons=[TechnologyComparison(**tc) for tc in validated_data.get("technology_comparisons", [])]
    )

    # Parse full report
    report = UIResearchReport(
        project_summary=validated_data.get("project_summary", ""),
        visual_direction=VisualDirection(**validated_data.get("visual_direction", {})),
        color_system=ColorSystem(**validated_data.get("color_system", {})),
        typography=TypographySystem(**validated_data.get("typography", {})),
        animation_strategy=AnimationStrategy(**validated_data.get("animation_strategy", {})),
        three_d_strategy=ThreeDStrategy(**validated_data.get("three_d_strategy", {})),
        tech_stack=tech_stack,
        performance_strategy=PerformanceStrategy(**validated_data.get("performance_strategy", {})),
        navigation_pattern=validated_data.get("navigation_pattern", ""),
        hero_section=validated_data.get("hero_section", ""),
        content_layout=validated_data.get("content_layout", ""),
        mobile_strategy=validated_data.get("mobile_strategy", ""),
        accessibility_strategy=validated_data.get("accessibility_strategy", ""),
        avoid=[AvoidItem(**a) for a in validated_data.get("avoid", [])],
        research=evidence,
        final_blueprint="OFFLINE FALLBACK\n\n" + validated_data.get("final_blueprint_text", "") if research_status != "completed" else validated_data.get("final_blueprint_text", "")
    )

    done_step = _activity("Research complete", status="done")
    done_step.__dict__["_report"] = report
    yield done_step
