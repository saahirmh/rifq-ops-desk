import { describe, expect, it } from "vitest";
import { planCorridorBrief, planFrontDeskTriage } from "./engine";
import { planScenario, ScenarioNotFoundError } from "./index";
import {
  agents,
  corridorDraft,
  corridorInput,
  tasks,
  triageItems,
} from "./fixtures";
import { deriveAgentStatuses, deriveTasks } from "./project";

function signature(events: { kind: string; tool?: string }[]) {
  return events.map((event) => event.tool ?? event.kind);
}

describe("planCorridorBrief", () => {
  it("rejects the unsourced suspension, then composes only the revised note", () => {
    const plan = planCorridorBrief(corridorInput());

    expect(signature(plan.events)).toEqual([
      "claim",
      "classify_channel",
      "handoff",
      "plan",
      "scan_fixture_sources",
      "draft_brief",
      "handoff",
      "check_claims",
      "handoff",
      "revise_brief",
      "handoff",
      "check_claims",
      "handoff",
      "compose_reply",
      "result",
    ]);

    const checks = plan.events.filter((event) => event.tool === "check_claims");
    expect(checks.map((event) => event.status)).toEqual(["warn", "ok"]);
    expect(plan.outcome).toBe("completed");
    expect(plan.sample).toBe(true);
    expect(plan.reply).toContain("18h to 31h");
    expect(plan.reply).toContain("fx-note-014");
    expect(plan.reply).toContain("does not support a claim");
    expect(plan.reply).not.toContain("All carriers have suspended the lane.");
    expect(plan.taskEffects.at(-1)).toMatchObject({
      taskId: "task-corridor",
      status: "done",
      assignedAgentId: "front-desk-router",
    });
    expect(tasks.every((task) => task.status === "queued")).toBe(true);
  });

  it("skips revision when the draft already matches the shelf", () => {
    const clean = corridorDraft.filter((claim) => claim.sourceIds.length > 0);
    const plan = planCorridorBrief(corridorInput({ draft: clean, revision: clean }));
    expect(plan.events.filter((event) => event.tool === "check_claims")).toHaveLength(1);
    expect(plan.events.some((event) => event.tool === "revise_brief")).toBe(false);
    expect(plan.outcome).toBe("completed");
    expect(plan.reply).not.toContain("All carriers have suspended the lane.");
  });

  it("holds billing before the shelf is opened", () => {
    const plan = planCorridorBrief(
      corridorInput({
        task: tasks.find((task) => task.id === "task-billing")!,
        message: "Please resend the invoice.",
      }),
    );
    expect(plan.outcome).toBe("needs_review");
    expect(plan.reply).toBeNull();
    expect(plan.events.some((event) => event.tool === "draft_brief")).toBe(false);
    expect(plan.events.some((event) => event.tool === "compose_reply")).toBe(false);
    expect(plan.taskEffects.at(-1)?.status).toBe("needs_review");
  });

  it("fails closed when the revision is still unsourced", () => {
    const plan = planCorridorBrief(
      corridorInput({
        revision: [{ text: "All carriers have suspended the lane.", sourceIds: [] }],
      }),
    );
    expect(plan.outcome).toBe("failed");
    expect(plan.reply).toBeNull();
    expect(plan.events.some((event) => event.tool === "compose_reply")).toBe(false);
    expect(plan.events.at(-1)).toMatchObject({ title: "Stop before send", status: "error" });
    expect(plan.taskEffects.at(-1)?.status).toBe("failed");
  });

  it("refuses a research path with no verifier or a tool the roster did not grant", () => {
    expect(() =>
      planCorridorBrief(
        corridorInput({
          agents: agents.filter((agent) => agent.id !== "qa-verifier"),
        }),
      ),
    ).toThrow(/qa-verifier/);

    const stripped = agents.map((agent) =>
      agent.id === "qa-verifier" ? { ...agent, tools: [] } : agent,
    );
    expect(() => planCorridorBrief(corridorInput({ agents: stripped }))).toThrow(/check_claims/);
  });
});

describe("planFrontDeskTriage", () => {
  it("claims research and holds scheduling and billing", () => {
    const plan = planFrontDeskTriage(triageItems(), agents);
    expect(plan.reply).toBeNull();
    expect(plan.outcome).toBe("needs_review");
    const byTask = Object.fromEntries(
      plan.taskEffects.map((effect) => [effect.taskId, effect.status]),
    );
    expect(byTask).toEqual({
      "task-corridor": "claimed",
      "task-schedule": "needs_review",
      "task-billing": "needs_review",
    });
    expect(plan.taskEffects.find((effect) => effect.taskId === "task-billing")?.assignedAgentId).toBe(
      null,
    );
    expect(plan.events.some((event) => event.tool === "compose_reply")).toBe(false);
    expect(plan.events.some((event) => event.agentId === "research-watcher")).toBe(true);
    const settled = deriveAgentStatuses(agents, plan.events, true);
    expect(settled["front-desk-router"]).toBe("done");
    expect(settled["research-watcher"]).toBe("done");
    expect(settled["qa-verifier"]).toBe("idle");
  });
});

describe("planScenario", () => {
  it("rejects an unknown rehearsal", () => {
    expect(() => planScenario("live-client")).toThrow(ScenarioNotFoundError);
  });
});

describe("desk projection", () => {
  it("applies task effects up to the visible trace and leaves the roster honest", () => {
    const plan = planScenario("corridor-brief");
    const warn = plan.events.find((event) => event.status === "warn");
    expect(warn).toBeTruthy();
    const visible = plan.events.filter((event) => event.atMs <= (warn?.atMs ?? 0));
    const projected = deriveTasks(tasks, plan.taskEffects, warn?.atMs ?? 0);
    expect(tasks[0]?.status).toBe("queued");
    expect(projected.find((task) => task.id === "task-corridor")?.status).toBe("running");
    expect(projected.find((task) => task.id === "task-billing")?.status).toBe("queued");

    const mid = deriveAgentStatuses(agents, visible, false);
    expect(mid["qa-verifier"]).toBe("review");
    expect(mid["front-desk-router"]).toBe("done");

    const settled = deriveAgentStatuses(agents, plan.events, true);
    expect(settled["research-watcher"]).toBe("done");
    expect(Object.values(deriveAgentStatuses(agents, [], false)).every((status) => status === "idle")).toBe(
      true,
    );
  });
});
