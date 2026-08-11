// Shared TypeScript types for Agent Studio V1
// These mirror the Pydantic models in backend/models/research.py

// ---------------------------------------------------------------------------
// Agent Registry
// ---------------------------------------------------------------------------

export type AgentStatus = "available" | "running" | "coming_soon" | "error";

export interface Agent {
  id: string;
  name: string;
  emoji: string;
  description: string;
  status: AgentStatus;
  version: string | null;
}

// ---------------------------------------------------------------------------
// Activity
// ---------------------------------------------------------------------------

export type ActivityStatus = "running" | "done" | "error";

export interface ActivityStep {
  id: string;
  timestamp: string; // ISO 8601
  agent: string;
  action: string;
  status: ActivityStatus;
}

// ---------------------------------------------------------------------------
// Research Report — mirrors backend Pydantic models
// ---------------------------------------------------------------------------

export interface VisualDirection {
  style: string;
  confidence: number; // 0–100
  description: string;
}

export interface ColorSystem {
  palette: string;
  primary: string;
  accent: string;
  background: string;
  description: string;
}

export interface TypographySystem {
  primary_font: string;
  code_font: string | null;
  scale: string;
  description: string;
}

export type AnimationRecommendation = "recommended" | "selective" | "avoid";

export interface AnimationTool {
  name: string;
  recommendation: AnimationRecommendation;
  reason: string;
}

export interface AnimationStrategy {
  intensity: number; // 0–10
  intensity_label: string;
  tools: AnimationTool[];
  scroll_behavior: string;
  description: string;
}

export type ComplexityLevel = "none" | "low" | "medium" | "high";
export type PerformanceRating = "good" | "moderate" | "heavy";

export interface ThreeDStrategy {
  use_3d: boolean;
  library: string | null;
  complexity: ComplexityLevel;
  scope: string;
  performance_rating: PerformanceRating;
  description: string;
}

export interface TechStackItem {
  category: string;
  name: string;
  version: string;
  verified_from: string | null;
  verified_at: string | null;
  reason: string;
}

export interface PerformanceStrategy {
  mobile_ready: boolean;
  reduced_motion_support: boolean;
  lazy_loading: boolean;
  bundle_strategy: string;
  description: string;
}

export interface AvoidItem {
  item: string;
  reason: string;
}

export interface ResearchSource {
  title: string;
  url: string;
  type: string;
  status: string;
}

export interface ResearchFinding {
  finding: string;
  source: ResearchSource;
}

export interface TechnologyComparison {
  technology: string;
  recommendation: string;
  reason: string;
}

export interface ResearchEvidence {
  status: string;
  error?: string | null;
  queries: string[];
  sources: ResearchSource[];
  findings: ResearchFinding[];
  technology_comparisons: TechnologyComparison[];
}

export interface UIResearchReport {
  project_summary: string;
  visual_direction: VisualDirection;
  color_system: ColorSystem;
  typography: TypographySystem;
  animation_strategy: AnimationStrategy;
  three_d_strategy: ThreeDStrategy;
  tech_stack: TechStackItem[];
  performance_strategy: PerformanceStrategy;
  navigation_pattern: string;
  hero_section: string;
  content_layout: string;
  mobile_strategy: string;
  accessibility_strategy: string;
  avoid: AvoidItem[];
  research?: ResearchEvidence;
  final_blueprint: string;
}

// ---------------------------------------------------------------------------
// API Response
// ---------------------------------------------------------------------------

export type SSEEventType = "activity" | "report" | "error" | "done";

export interface SSEActivity {
  type: "activity";
  step: ActivityStep;
}

export interface SSEReport {
  type: "report";
  report: UIResearchReport;
}

export interface SSEError {
  type: "error";
  message: string;
}

export interface SSEDone {
  type: "done";
}

export type SSEEvent = SSEActivity | SSEReport | SSEError | SSEDone;

// ---------------------------------------------------------------------------
// App-level state
// ---------------------------------------------------------------------------

export type ResearchPhase = "idle" | "running" | "done" | "error";

export interface ResearchState {
  phase: ResearchPhase;
  activity: ActivityStep[];
  report: UIResearchReport | null;
  error: string | null;
  activeAgentId: string | null;
}
