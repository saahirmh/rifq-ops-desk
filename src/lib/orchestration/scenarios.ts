import { planCorridorBrief, planFrontDeskTriage, ScenarioNotFoundError } from "./engine";
import { agents, corridorInput, triageItems } from "./fixtures";
import type { RunPlan, ScenarioSummary } from "./types";

export const scenarios: ScenarioSummary[] = [
  {
    id: "corridor-brief",
    title: "Corridor brief",
    summary:
      "A fixture WhatsApp note asks what changed on the sample corridor. QA rejects an unsourced suspension line before any reply exists.",
    taskId: "task-corridor",
  },
  {
    id: "front-desk-triage",
    title: "Front desk triage",
    summary:
      "Three fixture notes arrive together. Research is claimed by the watcher. Scheduling and billing stay held.",
    taskId: null,
  },
];

export function planScenario(scenarioId: string): RunPlan {
  switch (scenarioId) {
    case "corridor-brief":
      return planCorridorBrief(corridorInput());
    case "front-desk-triage":
      return planFrontDeskTriage(triageItems(), agents);
    default:
      throw new ScenarioNotFoundError(scenarioId);
  }
}
