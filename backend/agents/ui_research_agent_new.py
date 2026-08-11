"""
UI Research Agent — V2.1 (Evidence Grounded + Quality Scoring)
"""

import json
import re
import uuid
import logging
from datetime import datetime, timezone
from typing import AsyncGenerator
from urllib.parse import urlparse

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
    ResearchEvidence,
    ResearchQuality
)
from llm import ollama_client
from tools.web_search import search_web
from tools.browser import read_page

logger = logging.getLogger(__name__)

MAX_SEARCHES = 8
MAX_SOURCES = 12
MAX_RESEARCH_ROUNDS = 2
MIN_RELEVANCE_SCORE = 70

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
    
    # Try parsing array if it's an array
    match_arr = re.search(r"\[[\s\S]*\]", text)
    if match_arr:
        try:
            return json.loads(match_arr.group())
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

def _normalize_url(url: str) -> str:
    parsed = urlparse(url)
    return f"{parsed.scheme}://{parsed.netloc}{parsed.path}"

def _validate_and_repair_blueprint(report_data: dict) -> dict:
    """Python validation rules to fix contradictions in the blueprint."""
    # 1. 3D Rule
    three_d = report_data.get("three_d_strategy", {})
    use_3d = three_d.get("use_3d", False)
    
    hero = report_data.get("hero_section", "").lower()
    content = report_data.get("content_layout", "").lower()
    
    if not use_3d:
        # Strip 3D mentions if 3D is disabled
        if "3d " in hero or " 3d" in hero:
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
                "reason": "Standard modern library for 3D in React."
            })

    # 2. Animation Intensity Rule
    anim = report_data.get("animation_strategy", {})
    intensity = anim.get("intensity", 5)
    if intensity <= 4 and "excessive" in anim.get("intensity_label", "").lower():
        anim["intensity_label"] = "Subtle Modern"
        
    return report_data

def _calculate_quality(considered: int, read: int, relevant: int, findings: int) -> ResearchQuality:
    score = 0
    if considered > 0:
        score += 20
    if read > 0:
        score += 30
    if relevant > 0:
        score += (relevant / read) * 20 if read else 0
    if findings > 0:
        score += min(30, findings * 5)
        
    return ResearchQuality(
        score=int(score),
        sources_considered=considered,
        sources_read=read,
        relevant_sources=relevant,
        findings_extracted=findings
    )

async def run(request: UIResearchRequest) -> AsyncGenerator[ActivityStep, None]:
    yield _activity("Understanding requirements & planning research", status="running")
    
    # ---------------------------------------------------------
    # STAGE 1: RESEARCH PLANNING
    # ---------------------------------------------------------
    PLANNING_PROMPT = f"""Analyze this request: "{request.request}"
Identify the project type and necessary research categories.
Generate 2-4 HIGH-QUALITY web search queries.
IMPORTANT: Do NOT use full conversational sentences. Use short, targeted SEO keywords (e.g., "modern AI SaaS UI", "GSAP ScrollTrigger modern website").
Do NOT search for dictionary definitions.

Output ONLY JSON:
{{
  "project_type": "...",
  "research_categories": ["..."],
  "search_queries": ["query1", "query2"]
}}"""

    plan_data = {}
    try:
        plan_data = await _call_llm_json(PLANNING_PROMPT, system="You are a senior UI researcher. Output ONLY raw JSON.", retries=2)
        queries = plan_data.get("search_queries", [])[:4]
    except Exception as e:
        yield _activity(f"Failed to plan research ({e}).", status="error")
        queries = []

    # ---------------------------------------------------------
    # STAGE 2: WEB SEARCH & FILTER (ADAPTIVE)
    # ---------------------------------------------------------
    all_results = []
    executed_queries = set()
    research_status = "not_started"
    research_error = None
    
    if queries:
        research_status = "searching"
        yield _activity(f"Research plan created for '{plan_data.get('project_type', 'Website')}'. Executing {len(queries)} queries.", status="running")
        
        for q in queries:
            if q.lower() in executed_queries: continue
            executed_queries.add(q.lower())
            
            yield _activity(f"Searching: '{q}'", status="running")
            try:
                res_json = await search_web(q, num_results=4)
                res_data = json.loads(res_json)
                if res_data.get("results"):
                    all_results.extend(res_data["results"])
            except Exception as e:
                logger.error(f"Search failed for '{q}': {e}")
                research_error = f"Search provider error: {e}"

        # Deduplicate
        seen_urls = set()
        unique_results = []
        for r in all_results:
            n_url = _normalize_url(r["url"])
            if n_url not in seen_urls:
                seen_urls.add(n_url)
                unique_results.append(r)
                
    if not unique_results:
        research_status = "offline_fallback"
        yield _activity(f"WEB RESEARCH FAILED. {research_error or 'No web sources available'}. Falling back to offline knowledge.", status="error")
    else:
        research_status = "filtering"
        yield _activity(f"Found {len(unique_results)} raw results. Filtering for relevance...", status="running")
        
        # LLM Relevance Scoring
        results_text = json.dumps([{"id": i, "title": r["title"], "url": r["url"], "snippet": r["snippet"]} for i, r in enumerate(unique_results)], indent=2)
        FILTER_PROMPT = f"""Project: {plan_data.get('project_type', 'Website')}
Rate the relevance (0-100) of these search results for UI/UX/Technical research.
REJECT (0-49) dictionary definitions, generic news, or SEO spam.
Quality Score: Official docs/repos (90-100), good articles (70-89), random blogs (50-69).
Output JSON array:
[
  {{"id": 0, "relevance_score": 95, "quality_score": 90, "decision": "read", "reason": "..."}}
]

Results:
{results_text}"""
        
        try:
            scored_data = await _call_llm_json(FILTER_PROMPT, system="You are a critical web research filter. Output ONLY a JSON array of evaluations.", retries=2)
            if not isinstance(scored_data, list):
                if isinstance(scored_data, dict) and "evaluations" in scored_data:
                    scored_data = scored_data["evaluations"]
                else:
                    scored_data = []
                    
            # Map scores back to unique_results
            for score_item in scored_data:
                idx = score_item.get("id")
                if idx is not None and 0 <= idx < len(unique_results):
                    unique_results[idx]["relevance_score"] = score_item.get("relevance_score", 0)
                    unique_results[idx]["quality_score"] = score_item.get("quality_score", 0)
                    unique_results[idx]["decision"] = score_item.get("decision", "reject")
                    unique_results[idx]["reject_reason"] = score_item.get("reason", "Low relevance")
        except Exception as e:
            logger.warning(f"Failed to score results: {e}")
            # Fallback heuristic
            for r in unique_results:
                if "dictionary" in r["url"].lower() or "meaning" in r["title"].lower():
                    r["decision"] = "reject"
                    r["reject_reason"] = "Appears to be a dictionary or definition."
                else:
                    r["decision"] = "read"
                    r["relevance_score"] = 75

    rejected_sources = []
    read_sources = []
    
    if research_status == "filtering":
        approved = [r for r in unique_results if r.get("decision") == "read" and r.get("relevance_score", 0) >= MIN_RELEVANCE_SCORE]
        rejected = [r for r in unique_results if r.get("decision") != "read" or r.get("relevance_score", 0) < MIN_RELEVANCE_SCORE]
        
        for r in rejected:
            rejected_sources.append({"title": r["title"], "url": r["url"], "reason": r.get("reject_reason", "Low relevance score")})
            
        if not approved:
            research_status = "offline_fallback"
            yield _activity(f"All {len(rejected)} sources were rejected as irrelevant. Falling back to offline knowledge.", status="error")
        else:
            research_status = "reading"
            # Read top 3 highest relevance
            approved.sort(key=lambda x: x.get("relevance_score", 0) + x.get("quality_score", 0), reverse=True)
            urls_to_read = approved[:3]
            
            yield _activity(f"Rejected {len(rejected)} irrelevant sources. Reading top {len(urls_to_read)} sources...", status="running")
            
            for r in urls_to_read:
                yield _activity(f"Reading: {r['title'][:30]}...", status="running")
                try:
                    content = await read_page(r["url"])
                    read_sources.append({
                        "title": r["title"],
                        "url": r["url"],
                        "snippet": r["snippet"],
                        "content": content[:2500], # Maximize context limit safely
                        "type": "official_documentation" if ("docs" in r["url"] or "github" in r["url"]) else "technical_article",
                        "status": "read",
                        "relevance_score": r.get("relevance_score", 75),
                        "quality_score": r.get("quality_score", 75)
                    })
                except Exception as e:
                    logger.warning(f"Failed to read {r['url']}: {e}")
                    read_sources.append({
                        "title": r["title"],
                        "url": r["url"],
                        "snippet": r["snippet"],
                        "type": "unknown",
                        "status": "failed",
                        "relevance_score": 0,
                        "quality_score": 0
                    })
                    rejected_sources.append({"title": r["title"], "url": r["url"], "reason": f"Failed to load: {e}"})
            
            if any(s["status"] == "read" for s in read_sources):
                research_status = "extracting"
            else:
                research_status = "offline_fallback"
                yield _activity(f"Failed to load page content. Falling back to offline knowledge.", status="error")

    # ---------------------------------------------------------
    # STAGE 3: EVIDENCE EXTRACTION (QWEN)
    # ---------------------------------------------------------
    extracted_findings = []
    if research_status == "extracting":
        yield _activity("Extracting key UI/UX findings from sources...", status="running")
        
        sources_text = ""
        for i, s in enumerate([s for s in read_sources if s["status"] == "read"]):
            sources_text += f"SOURCE URL: {s['url']}\nTITLE: {s['title']}\nCONTENT: {s['content']}\n\n"
            
        EXTRACT_PROMPT = f"""Project: {plan_data.get('project_type', 'Website')}
Extract 5-8 concrete UI/UX findings or technical recommendations from these sources.
Output JSON array:
[
  {{"finding": "...", "category": "typography", "source_url": "...", "confidence": 0.9}}
]

{sources_text}"""

        try:
            findings_data = await _call_llm_json(EXTRACT_PROMPT, system="You are an expert UI researcher extracting facts. Output ONLY JSON array.", retries=2)
            if isinstance(findings_data, list):
                extracted_findings = findings_data
            elif isinstance(findings_data, dict) and "findings" in findings_data:
                extracted_findings = findings_data["findings"]
            
            yield _activity(f"Extracted {len(extracted_findings)} evidence-backed findings.", status="running")
            research_status = "completed"
        except Exception as e:
            logger.error(f"Failed to extract findings: {e}")
            yield _activity(f"Failed to extract structured findings, but continuing with raw source context.", status="error")
            research_status = "completed" # We still have sources for synthesis

    # ---------------------------------------------------------
    # STAGE 4: SYNTHESIS & VALIDATION
    # ---------------------------------------------------------
    yield _activity("Synthesizing final UI recommendations...", status="running")
    
    research_context = "OFFLINE RESULT - Use your baseline knowledge."
    if research_status == "completed":
        research_context = f"EXTRACTED EVIDENCE FINDINGS:\n{json.dumps(extracted_findings, indent=2)}\n\n"

    SYNTHESIS_SYSTEM = """You are a Senior Frontend Architect.
Generate a SIMPLE final UI JSON blueprint based on the provided evidence.
Do NOT output URLs, version numbers, timestamps, or research metadata.
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
    {"category": "Animation", "options": [{"name": "Motion", "best_for": "subtle UI"}, {"name": "GSAP", "best_for": "complex scrolls"}], "selected": "Motion", "reason": "..."}
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
    
    try:
        raw_data = await _call_llm_json(SYNTHESIS_PROMPT, system=SYNTHESIS_SYSTEM, retries=2)
    except Exception as e:
        yield _activity(f"Error generating blueprint: {e}", status="error")
        return

    yield _activity("Validating blueprint consistency and compiling metadata...", status="running")
    validated_data = _validate_and_repair_blueprint(raw_data)
    
    # Python Metadata Injection
    current_time = datetime.now(timezone.utc).isoformat()
    verified_url = None
    if research_status == "completed" and read_sources:
        # Just use the first successful source as the generic verified_from if needed
        successful = [s for s in read_sources if s["status"] == "read"]
        if successful:
            verified_url = successful[0]["url"]
            
    tech_stack = []
    for t in validated_data.get("tech_stack", []):
        is_verified = (research_status == "completed")
        tech_stack.append(TechStackItem(
            category=t.get("category", "Tool"),
            name=t.get("name", ""),
            version=None, # Never guess
            verified=is_verified,
            verified_from=verified_url if is_verified else None,
            verified_at=current_time if is_verified else None,
            reason=t.get("reason", "")
        ))

    evidence = ResearchEvidence(
        status=research_status,
        error=research_error,
        queries=list(executed_queries),
        sources=[ResearchSource(title=s["title"], url=s["url"], type=s["type"], status=s["status"], relevance_score=s.get("relevance_score", 0), quality_score=s.get("quality_score", 0)) for s in read_sources],
        rejected_sources=rejected_sources,
        findings=[ResearchFinding(finding=f.get("finding", ""), category=f.get("category", ""), source_url=f.get("source_url", ""), confidence=f.get("confidence", 0.5)) for f in extracted_findings],
        technology_comparisons=[TechnologyComparison(**tc) for tc in validated_data.get("technology_comparisons", [])]
    )

    quality = _calculate_quality(
        considered=len(unique_results),
        read=len([s for s in read_sources if s["status"] == "read"]),
        relevant=len([s for s in read_sources if s["status"] == "read" and s.get("relevance_score", 0) >= MIN_RELEVANCE_SCORE]),
        findings=len(extracted_findings)
    )

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
        research_quality=quality,
        final_blueprint="OFFLINE FALLBACK\n\n" + validated_data.get("final_blueprint_text", "") if research_status != "completed" else validated_data.get("final_blueprint_text", "")
    )

    done_step = _activity("Research complete", status="done")
    done_step.__dict__["_report"] = report
    yield done_step
