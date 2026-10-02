import { agents, planScenario, scenarios, tasks } from "./orchestration";
import type { DeskSnapshot, RunPlan } from "./orchestration";
import { ScenarioNotFoundError } from "./orchestration";

export function getDesk(): DeskSnapshot {
  return {
    sample: true,
    agents,
    tasks,
    scenarios,
  };
}

export function openReplay(search: {
  scenario?: string | string[];
  at?: string | string[];
}): { plan: RunPlan; cursor: number } | null {
  const scenario = first(search.scenario);
  const at = first(search.at);
  if (!scenario || !at) return null;

  let plan: RunPlan;
  try {
    plan = planScenario(scenario);
  } catch (error) {
    if (error instanceof ScenarioNotFoundError) return null;
    throw error;
  }

  if (at === "full") return { plan, cursor: plan.events.length };
  const cursor = Number(at);
  if (!Number.isInteger(cursor) || cursor < 0) return { plan, cursor: 0 };
  return { plan, cursor: Math.min(cursor, plan.events.length) };
}

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}
