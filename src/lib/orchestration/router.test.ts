import { describe, expect, it } from "vitest";
import { agents } from "./fixtures";
import { routeTask } from "./router";

const samples = [
  "Draft a sourced corridor brief.",
  "Schedule a call on Thursday.",
  "Resend the invoice.",
  "Hello from the lobby.",
];

describe("routeTask", () => {
  it("claims research for the watcher and still refuses auto-send", () => {
    const decision = routeTask("Draft a sourced corridor brief.", agents);
    expect(decision).toMatchObject({
      intent: "research_brief",
      agentId: "research-watcher",
      autoSend: false,
      queueStatus: "claimed",
    });
  });

  it("holds scheduling on the front desk", () => {
    expect(routeTask("Schedule a call on Thursday.", agents)).toMatchObject({
      intent: "scheduling",
      agentId: "front-desk-router",
      autoSend: false,
      queueStatus: "needs_review",
    });
  });

  it("holds billing with no assignee", () => {
    expect(routeTask("Resend the invoice.", agents)).toMatchObject({
      intent: "billing",
      agentId: null,
      autoSend: false,
      queueStatus: "needs_review",
    });
  });

  it("holds research when the watcher is off the roster", () => {
    const roster = agents.filter((agent) => agent.id !== "research-watcher");
    expect(routeTask("Draft a corridor brief.", roster)).toMatchObject({
      intent: "research_brief",
      agentId: null,
      queueStatus: "needs_review",
      autoSend: false,
    });
  });

  it("never marks autoSend", () => {
    for (const text of samples) {
      expect(routeTask(text, agents).autoSend).toBe(false);
    }
  });
});
