import type {
  Agent,
  Claim,
  CorridorInput,
  RunOutcome,
  RunPlan,
  TaskEffect,
  TaskStatus,
  TraceEvent,
  TraceKind,
  TraceStatus,
  TriageItem,
  VerificationIssue,
} from "./types";
import { routeTask } from "./router";
import { approvedClaims, composeReply, verifyClaims } from "./verify";

const MS: Record<TraceKind, number> = {
  claim: 360,
  plan: 420,
  tool: 640,
  handoff: 300,
  result: 480,
};

class ScenarioNotFoundError extends Error {
  constructor(scenarioId: string) {
    super(`Unknown scenario "${scenarioId}".`);
    this.name = "ScenarioNotFoundError";
  }
}

export { ScenarioNotFoundError };

function requireAgent(agents: Agent[], id: string): Agent {
  const agent = agents.find((item) => item.id === id);
  if (!agent) throw new Error(`Roster is missing ${id}.`);
  return agent;
}

function assertTool(agent: Agent, tool: string) {
  if (!agent.tools.includes(tool)) {
    throw new Error(`${agent.id} is not allowed to call ${tool}.`);
  }
}

interface TraceLog {
  events: TraceEvent[];
  taskEffects: TaskEffect[];
  add(event: Omit<TraceEvent, "id" | "atMs" | "durationMs"> & { durationMs?: number }): TraceEvent;
  mark(taskId: string, status: TaskStatus, assignedAgentId: string | null, atMs: number): void;
}

function createTrace(prefix: string): TraceLog {
  let at = 0;
  let n = 0;
  const events: TraceEvent[] = [];
  const taskEffects: TaskEffect[] = [];

  return {
    events,
    taskEffects,
    add(event) {
      const durationMs = event.durationMs ?? MS[event.kind];
      const full: TraceEvent = {
        ...event,
        durationMs,
        id: `${prefix}-${n + 1}`,
        atMs: at,
      };
      n += 1;
      at += durationMs;
      events.push(full);
      return full;
    },
    mark(taskId, status, assignedAgentId, atMs) {
      taskEffects.push({ taskId, status, assignedAgentId, atMs });
    },
  };
}

function seal(
  prefix: string,
  scenarioId: string,
  title: string,
  summary: string,
  log: TraceLog,
  outcome: RunOutcome,
  reply: string | null,
): RunPlan {
  return {
    id: `run_${prefix}`,
    scenarioId,
    title,
    summary,
    sample: true,
    events: log.events,
    taskEffects: log.taskEffects,
    outcome,
    reply,
  };
}

function hold(
  log: TraceLog,
  agentId: string,
  taskId: string,
  assignedAgentId: string | null,
  detail: string,
  output: unknown,
): void {
  const held = log.add({
    agentId,
    kind: "result",
    title: "Hold for a human",
    detail,
    status: "warn",
    output,
  });
  log.mark(taskId, "needs_review", assignedAgentId, held.atMs);
}

/**
 * Deterministic rehearsal of the desk policy. Drafts are fixture inputs;
 * the engine decides routing, verification, and whether a reply may exist.
 */
export function planCorridorBrief(input: CorridorInput): RunPlan {
  const desk = requireAgent(input.agents, "front-desk-router");
  const log = createTrace("corridor");
  const decision = routeTask(input.message, input.agents);
  const summary =
    "A fixture note moves from intake through the shelf and QA. The reply exists only after the revision checks out.";

  assertTool(desk, "classify_channel");

  const claimed = log.add({
    agentId: desk.id,
    kind: "claim",
    title: "Claim inbound note",
    detail: "Front desk takes the sample note off the queue.",
    status: "ok",
    input: {
      taskId: input.task.id,
      channel: input.task.source,
      text: input.message,
    },
    output: { claimedBy: desk.id },
  });
  log.mark(input.task.id, "claimed", desk.id, claimed.atMs);

  log.add({
    agentId: desk.id,
    kind: "tool",
    title: "Classify the channel",
    detail: decision.reason,
    tool: "classify_channel",
    status: "ok",
    input: { text: input.message },
    output: decision,
  });

  if (decision.intent !== "research_brief" || decision.queueStatus !== "claimed" || !decision.agentId) {
    hold(
      log,
      desk.id,
      input.task.id,
      decision.agentId,
      "This note does not enter the research path.",
      decision,
    );
    return seal(
      "corridor",
      "corridor-brief",
      "Corridor brief",
      summary,
      log,
      "needs_review",
      null,
    );
  }

  const research = requireAgent(input.agents, "research-watcher");
  const qa = requireAgent(input.agents, "qa-verifier");

  const toResearch = log.add({
    agentId: desk.id,
    kind: "handoff",
    title: "Hand off to Research Watcher",
    detail: "The note is a research ask. Intake stops here.",
    status: "ok",
    input: { from: desk.id, to: research.id },
    output: { acceptedBy: research.id },
  });
  log.mark(input.task.id, "running", research.id, toResearch.atMs);

  log.add({
    agentId: research.id,
    kind: "plan",
    title: "Open the fixture shelf",
    detail: "The watcher will only use the labeled sample notes for this cycle.",
    status: "ok",
    input: { shelf: "sample-corridor" },
    output: { sourceCount: input.sources.length },
  });

  assertTool(research, "scan_fixture_sources");
  log.add({
    agentId: research.id,
    kind: "tool",
    title: "Scan fixture sources",
    detail: "Three sample notes are on the shelf. No live feed is attached.",
    tool: "scan_fixture_sources",
    status: "ok",
    input: { shelf: "sample-corridor" },
    output: { sources: input.sources },
  });

  assertTool(research, "draft_brief");
  log.add({
    agentId: research.id,
    kind: "tool",
    title: "Draft the brief",
    detail: "First pass includes one line the shelf does not support.",
    tool: "draft_brief",
    status: "ok",
    input: { sourceIds: input.sources.map((source) => source.id) },
    output: { claims: input.draft },
  });

  const toQa = log.add({
    agentId: research.id,
    kind: "handoff",
    title: "Hand off to QA Verifier",
    detail: "No reply is composed until the claims are checked.",
    status: "ok",
    input: { from: research.id, to: qa.id },
    output: { acceptedBy: qa.id },
  });
  log.mark(input.task.id, "running", qa.id, toQa.atMs);

  const firstIssues = verifyClaims(input.draft, input.sources);
  assertTool(qa, "check_claims");
  log.add(checkEvent(qa.id, input.draft, firstIssues, firstIssues.length === 0 ? "first" : "reject"));

  let finalClaims = input.draft;
  if (firstIssues.length > 0) {
    const back = log.add({
      agentId: qa.id,
      kind: "handoff",
      title: "Return the draft for revision",
      detail: "QA sends the unsourced line back. The desk still has not replied.",
      status: "warn",
      input: { from: qa.id, to: research.id, issues: firstIssues },
      output: { acceptedBy: research.id },
    });
    log.mark(input.task.id, "running", research.id, back.atMs);

    assertTool(research, "revise_brief");
    log.add({
      agentId: research.id,
      kind: "tool",
      title: "Revise the brief",
      detail: "The suspension line is replaced with what the shelf actually supports.",
      tool: "revise_brief",
      status: "ok",
      input: { issues: firstIssues },
      output: { claims: input.revision },
    });
    finalClaims = input.revision;

    const recheck = log.add({
      agentId: research.id,
      kind: "handoff",
      title: "Recheck with QA",
      detail: "The revision goes back to the verifier before compose.",
      status: "ok",
      input: { from: research.id, to: qa.id },
      output: { acceptedBy: qa.id },
    });
    log.mark(input.task.id, "running", qa.id, recheck.atMs);

    const secondIssues = verifyClaims(input.revision, input.sources);
    log.add(
      checkEvent(qa.id, input.revision, secondIssues, secondIssues.length === 0 ? "pass" : "fail"),
    );

    if (secondIssues.length > 0 || approvedClaims(input.revision, secondIssues).length === 0) {
      return failClosed(log, qa.id, input.task.id, summary, secondIssues);
    }
  } else if (approvedClaims(finalClaims, firstIssues).length === 0) {
    return failClosed(log, qa.id, input.task.id, summary, firstIssues);
  }

  const approved = approvedClaims(finalClaims, verifyClaims(finalClaims, input.sources));
  if (approved.length === 0) {
    return failClosed(log, qa.id, input.task.id, summary, verifyClaims(finalClaims, input.sources));
  }

  const release = log.add({
    agentId: qa.id,
    kind: "handoff",
    title: "Release the note to the front desk",
    detail: "QA signed the fixture claims. Intake may compose the sample reply.",
    status: "ok",
    input: { from: qa.id, to: desk.id },
    output: { acceptedBy: desk.id },
  });
  log.mark(input.task.id, "running", desk.id, release.atMs);

  assertTool(desk, "compose_reply");
  const reply = composeReply(approved);
  log.add({
    agentId: desk.id,
    kind: "tool",
    title: "Compose the sample reply",
    detail: "The reply quotes approved claims and names their fixture sources.",
    tool: "compose_reply",
    status: "ok",
    input: { claims: approved },
    output: { reply },
  });

  const ready = log.add({
    agentId: desk.id,
    kind: "result",
    title: "Desk note ready",
    detail: "Sample reply composed. It is not sent to anyone.",
    status: "ok",
    output: { reply },
  });
  log.mark(input.task.id, "done", desk.id, ready.atMs);

  return seal("corridor", "corridor-brief", "Corridor brief", summary, log, "completed", reply);
}

function checkEvent(
  agentId: string,
  claims: Claim[],
  issues: VerificationIssue[],
  phase: "first" | "reject" | "pass" | "fail",
): Omit<TraceEvent, "id" | "atMs" | "durationMs"> {
  const failed = issues.length > 0;
  const copy: Record<typeof phase, { title: string; detail: string; status: TraceStatus }> = {
    first: {
      title: "Claims match the shelf",
      detail: "Every draft line cites a known fixture source.",
      status: "ok",
    },
    reject: {
      title: "Reject unsourced claims",
      detail: "The shelf does not support a full suspension. The draft goes back.",
      status: "warn",
    },
    pass: {
      title: "Revision matches the shelf",
      detail: "The second pass cites only known fixture sources.",
      status: "ok",
    },
    fail: {
      title: "Revision still fails the shelf",
      detail: "QA stops the cycle. No sample reply is composed.",
      status: "error",
    },
  };
  const chosen = copy[phase];
  return {
    agentId,
    kind: "tool",
    title: chosen.title,
    detail: chosen.detail,
    tool: "check_claims",
    status: failed ? chosen.status : "ok",
    input: { claims },
    output: { ok: !failed, issues },
  };
}

function failClosed(
  log: TraceLog,
  agentId: string,
  taskId: string,
  summary: string,
  issues: VerificationIssue[],
): RunPlan {
  const stopped = log.add({
    agentId,
    kind: "result",
    title: "Stop before send",
    detail: "QA did not approve a reply.",
    status: "error",
    output: { issues },
  });
  log.mark(taskId, "failed", agentId, stopped.atMs);
  return seal("corridor", "corridor-brief", "Corridor brief", summary, log, "failed", null);
}

export function planFrontDeskTriage(items: TriageItem[], agents: Agent[]): RunPlan {
  const desk = requireAgent(agents, "front-desk-router");
  assertTool(desk, "classify_channel");
  const log = createTrace("triage");
  const summary =
    "Three fixture notes arrive together. Research is claimed. Scheduling and billing stay held.";

  for (const item of items) {
    const decision = routeTask(item.message, agents);
    log.add({
      agentId: desk.id,
      kind: "tool",
      title: `Classify “${item.task.title}”`,
      detail: decision.reason,
      tool: "classify_channel",
      status: decision.queueStatus === "claimed" ? "ok" : "warn",
      input: { taskId: item.task.id, text: item.message },
      output: decision,
    });

    if (decision.intent === "research_brief" && decision.agentId && decision.queueStatus === "claimed") {
      const research = requireAgent(agents, decision.agentId);
      const handed = log.add({
        agentId: desk.id,
        kind: "handoff",
        title: `Hand “${item.task.title}” to the watcher`,
        detail: "Intake stops at the handoff. This cycle does not draft the brief.",
        status: "ok",
        input: { from: desk.id, to: research.id, taskId: item.task.id },
        output: { acceptedBy: research.id },
      });
      log.mark(item.task.id, "claimed", research.id, handed.atMs);
      log.add({
        agentId: research.id,
        kind: "claim",
        title: `Accept “${item.task.title}”`,
        detail: "Research Watcher holds the note. Drafting waits for the corridor cycle.",
        status: "ok",
        input: { taskId: item.task.id },
        output: { status: "claimed" },
      });
      continue;
    }

    const parked = log.add({
      agentId: desk.id,
      kind: "plan",
      title: `Park “${item.task.title}”`,
      detail: "A human still has to act. The router will not book or discuss payment.",
      status: "warn",
      input: { taskId: item.task.id },
      output: decision,
    });
    log.mark(item.task.id, "needs_review", decision.agentId, parked.atMs);
  }

  const needsHuman = log.taskEffects.some((effect) => effect.status === "needs_review");
  log.add({
    agentId: desk.id,
    kind: "result",
    title: needsHuman ? "Triage parked for review" : "Triage claimed the queue",
    detail: needsHuman
      ? "Research is with the watcher. Scheduling and billing remain on hold."
      : "Every note was claimed. Nothing was sent.",
    status: needsHuman ? "warn" : "ok",
    output: {
      claimed: log.taskEffects.filter((effect) => effect.status === "claimed").length,
      held: log.taskEffects.filter((effect) => effect.status === "needs_review").length,
    },
  });

  return seal(
    "triage",
    "front-desk-triage",
    "Front desk triage",
    summary,
    log,
    needsHuman ? "needs_review" : "completed",
    null,
  );
}
