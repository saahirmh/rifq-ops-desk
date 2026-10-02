import type {
  Agent,
  Claim,
  CorridorInput,
  DeskTask,
  FixtureSource,
  TriageItem,
} from "./types";

export const agents: Agent[] = [
  {
    id: "front-desk-router",
    name: "Front Desk Router",
    role: "Intake",
    mandate:
      "Classifies sample inbound notes and hands research asks to the watcher. Never answers billing.",
    tools: ["classify_channel", "compose_reply"],
    sample: true,
  },
  {
    id: "research-watcher",
    name: "Research Watcher",
    role: "Corridor",
    mandate:
      "Reads the fixture shelf and drafts a sourced note. Will not invent a carrier suspension.",
    tools: ["scan_fixture_sources", "draft_brief", "revise_brief"],
    sample: true,
  },
  {
    id: "qa-verifier",
    name: "QA Verifier",
    role: "Check",
    mandate:
      "Rejects claims the fixture shelf does not support, then rechecks the revision before any reply.",
    tools: ["check_claims"],
    sample: true,
  },
];

export const tasks: DeskTask[] = [
  {
    id: "task-corridor",
    title: "Corridor delay note",
    body: "A partner asked whether the sample corridor watch changed this week. Draft a sourced note before the internal review.",
    source: "whatsapp",
    priority: "high",
    status: "queued",
    assignedAgentId: null,
    sample: true,
  },
  {
    id: "task-schedule",
    title: "Hold a Thursday call",
    body: "Can someone schedule a 20-minute call on Thursday to walk through the note?",
    source: "whatsapp",
    priority: "normal",
    status: "queued",
    assignedAgentId: null,
    sample: true,
  },
  {
    id: "task-billing",
    title: "Invoice question",
    body: "Please resend last month's invoice and confirm the payment landed.",
    source: "manual",
    priority: "low",
    status: "queued",
    assignedAgentId: null,
    sample: true,
  },
];

export const corridorSources: FixtureSource[] = [
  {
    id: "fx-note-014",
    title: "Sample lane note",
    excerpt:
      "Average wait at the sample corridor checkpoint moved from 18h to 31h in the fixture week.",
  },
  {
    id: "fx-note-022",
    title: "Sample carrier bulletin",
    excerpt:
      "Two sailings were re-timed. The fixture set contains no security advisory and no notice of a full suspension.",
  },
  {
    id: "fx-note-031",
    title: "Sample desk log",
    excerpt: "Partners asked for a written brief before Thursday's internal review.",
  },
];

export const corridorDraft: Claim[] = [
  {
    text: "Average checkpoint wait in the fixture week moved from 18h to 31h.",
    sourceIds: ["fx-note-014"],
  },
  {
    text: "Two sample sailings were re-timed, with no security advisory in the fixture set.",
    sourceIds: ["fx-note-022"],
  },
  {
    text: "All carriers have suspended the lane.",
    sourceIds: [],
  },
];

export const corridorRevision: Claim[] = [
  {
    text: "Average checkpoint wait in the fixture week moved from 18h to 31h.",
    sourceIds: ["fx-note-014"],
  },
  {
    text: "Two sample sailings were re-timed, with no security advisory in the fixture set.",
    sourceIds: ["fx-note-022"],
  },
  {
    text: "The fixture shelf does not support a claim that the lane is fully suspended.",
    sourceIds: ["fx-note-022"],
  },
];

export function taskById(id: string): DeskTask {
  const task = tasks.find((item) => item.id === id);
  if (!task) throw new Error(`Missing fixture task ${id}.`);
  return task;
}

export function corridorInput(overrides: Partial<CorridorInput> = {}): CorridorInput {
  const task = taskById("task-corridor");
  return {
    task,
    message: task.body,
    sources: corridorSources,
    draft: corridorDraft,
    revision: corridorRevision,
    agents,
    ...overrides,
  };
}

export function triageItems(): TriageItem[] {
  return tasks.map((task) => ({ task, message: task.body }));
}
