export type AgentStatus = "idle" | "live" | "review" | "done";

export interface Agent {
  id: string;
  name: string;
  role: string;
  mandate: string;
  tools: string[];
  sample: true;
}

export type Intent = "research_brief" | "scheduling" | "billing" | "unclassified";

export type TaskStatus =
  | "queued"
  | "claimed"
  | "running"
  | "needs_review"
  | "done"
  | "failed";

export type TaskSource = "whatsapp" | "research_feed" | "manual";

export type TaskPriority = "low" | "normal" | "high";

export interface DeskTask {
  id: string;
  title: string;
  body: string;
  source: TaskSource;
  priority: TaskPriority;
  status: TaskStatus;
  assignedAgentId: string | null;
  sample: true;
}

export interface FixtureSource {
  id: string;
  title: string;
  excerpt: string;
}

export interface Claim {
  text: string;
  sourceIds: string[];
}

export type VerificationCode = "missing_source" | "unknown_source" | "empty_claim";

export interface VerificationIssue {
  claimIndex: number;
  code: VerificationCode;
  message: string;
}

export type TraceKind = "claim" | "plan" | "tool" | "handoff" | "result";

export type TraceStatus = "ok" | "warn" | "error";

export interface TraceEvent {
  id: string;
  agentId: string;
  kind: TraceKind;
  title: string;
  detail: string;
  tool?: string;
  status: TraceStatus;
  atMs: number;
  durationMs: number;
  input?: unknown;
  output?: unknown;
}

export interface TaskEffect {
  taskId: string;
  status: TaskStatus;
  assignedAgentId: string | null;
  atMs: number;
}

export type RunOutcome = "completed" | "needs_review" | "failed";

export interface RunPlan {
  id: string;
  scenarioId: string;
  title: string;
  summary: string;
  sample: true;
  events: TraceEvent[];
  taskEffects: TaskEffect[];
  outcome: RunOutcome;
  reply: string | null;
}

export interface RoutingDecision {
  intent: Intent;
  agentId: string | null;
  autoSend: false;
  queueStatus: "claimed" | "needs_review";
  reason: string;
}

export interface ScenarioSummary {
  id: string;
  title: string;
  summary: string;
  taskId: string | null;
}

export interface DeskSnapshot {
  sample: true;
  agents: Agent[];
  tasks: DeskTask[];
  scenarios: ScenarioSummary[];
}

export interface CorridorInput {
  task: DeskTask;
  message: string;
  sources: FixtureSource[];
  draft: Claim[];
  revision: Claim[];
  agents: Agent[];
}

export interface TriageItem {
  task: DeskTask;
  message: string;
}
