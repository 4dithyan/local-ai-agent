from pydantic import BaseModel, Field
from typing import Optional


# ---------------------------------------------------------------------------
# Request / Input Models
# ---------------------------------------------------------------------------

class UIResearchRequest(BaseModel):
    """Input from the user describing what kind of website they want built."""
    request: str = Field(..., description="Natural-language description of the website")


# ---------------------------------------------------------------------------
# Activity / Streaming Models
# ---------------------------------------------------------------------------

class ActivityStep(BaseModel):
    """A single activity entry emitted by the agent during research."""
    id: str
    timestamp: str          # ISO 8601
    agent: str              # e.g. "UI Research Agent"
    action: str             # Human-readable action description
    status: str             # "running" | "done" | "error"


# ---------------------------------------------------------------------------
# Research Output — Structured Sections
# ---------------------------------------------------------------------------

class VisualDirection(BaseModel):
    style: str              # e.g. "Minimal Futuristic"
    confidence: int         # 0–100
    description: str


class ColorSystem(BaseModel):
    palette: str            # e.g. "Dark neutral + indigo accent"
    primary: str
    accent: str
    background: str
    description: str


class TypographySystem(BaseModel):
    primary_font: str       # e.g. "Inter"
    code_font: Optional[str] = None
    scale: str              # e.g. "Fluid type scale"
    description: str


class AnimationTool(BaseModel):
    name: str               # e.g. "Framer Motion"
    recommendation: str     # "recommended" | "selective" | "avoid"
    reason: str


class AnimationStrategy(BaseModel):
    intensity: int          # 0–10
    intensity_label: str    # e.g. "Subtle Modern"
    tools: list[AnimationTool]
    scroll_behavior: str
    description: str


class ThreeDStrategy(BaseModel):
    use_3d: bool
    library: Optional[str] = None    # e.g. "React Three Fiber"
    complexity: str                  # "none" | "low" | "medium" | "high"
    scope: str                       # e.g. "Hero only"
    performance_rating: str          # "good" | "moderate" | "heavy"
    description: str


class TechStackItem(BaseModel):
    category: str           # e.g. "Animation", "Styling"
    name: str
    version: str            # e.g. "latest", or specific version if found
    verified_from: Optional[str] = None
    verified_at: Optional[str] = None
    reason: str


class PerformanceStrategy(BaseModel):
    mobile_ready: bool
    reduced_motion_support: bool
    lazy_loading: bool
    bundle_strategy: str
    description: str


class AvoidItem(BaseModel):
    item: str
    reason: str


# ---------------------------------------------------------------------------
# Top-Level Report
# ---------------------------------------------------------------------------

class ResearchSource(BaseModel):
    title: str
    url: str
    type: str               # e.g. "Official Documentation", "Article", "GitHub"
    status: str             # e.g. "search_result", "opened", "read", "failed"


class ResearchFinding(BaseModel):
    finding: str
    source: ResearchSource


class TechnologyComparison(BaseModel):
    technology: str
    recommendation: str
    reason: str


class ResearchEvidence(BaseModel):
    status: str             # "completed", "offline_fallback", "failed"
    error: Optional[str] = None
    queries: list[str]
    sources: list[ResearchSource]
    findings: list[ResearchFinding]
    technology_comparisons: list[TechnologyComparison]


class UIResearchReport(BaseModel):
    """The complete structured output of the UI Research Agent."""
    project_summary: str
    visual_direction: VisualDirection
    color_system: ColorSystem
    typography: TypographySystem
    animation_strategy: AnimationStrategy
    three_d_strategy: ThreeDStrategy
    tech_stack: list[TechStackItem]
    performance_strategy: PerformanceStrategy
    navigation_pattern: str
    hero_section: str
    content_layout: str
    mobile_strategy: str
    accessibility_strategy: str
    avoid: list[AvoidItem]
    research: Optional[ResearchEvidence] = None
    final_blueprint: str


class UIResearchResponse(BaseModel):
    """Top-level API response envelope."""
    success: bool
    report: Optional[UIResearchReport] = None
    error: Optional[str] = None
    activity_log: list[ActivityStep] = []
