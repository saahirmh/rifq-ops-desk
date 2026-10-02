import type { Agent, AgentStatus, DeskTask, TaskEffect, TraceEvent } from "./types";

export function deriveTasks(
  tasks: DeskTask[],
  effects: TaskEffect[],
  atMs: number | null,
): DeskTask[] {
  if (atMs === null) return tasks.map((task) => ({ ...task }));

  return tasks.map((task) => {
    const applicable = effects.filter((effect) => effect.taskId === task.id && effect.atMs <= atMs);
    const last = applicable[applicable.length - 1];
    if (!last) return { ...task };
    return {
      ...task,
      status: last.status,
      assignedAgentId: last.assignedAgentId,
    };
  });
}

export function deriveAgentStatuses(
  agents: Agent[],
  events: TraceEvent[],
  settled: boolean,
): Record<string, AgentStatus> {
  const seen = new Set(events.map((event) => event.agentId));
  const latest = events[events.length - 1];
  const statuses: Record<string, AgentStatus> = {};

  for (const agent of agents) {
    if (!seen.has(agent.id)) {
      statuses[agent.id] = "idle";
      continue;
    }
    if (settled) {
      const errored = events.some((event) => event.agentId === agent.id && event.status === "error");
      statuses[agent.id] = errored ? "review" : "done";
      continue;
    }
    if (latest && latest.agentId === agent.id) {
      statuses[agent.id] = latest.status === "ok" ? "live" : "review";
    } else {
      statuses[agent.id] = "done";
    }
  }

  return statuses;
}

export function summarizePlan(events: TraceEvent[]) {
  return {
    traces: events.length,
    handoffs: events.filter((event) => event.kind === "handoff").length,
    warnings: events.filter((event) => event.status === "warn" || event.status === "error").length,
  };
}
