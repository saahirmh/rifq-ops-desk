import { describe, expect, it } from "vitest";
import { getDesk, openReplay } from "./desk";
import { formatOffset } from "./format";

describe("getDesk", () => {
  it("publishes a labeled sample roster", () => {
    const desk = getDesk();
    expect(desk.sample).toBe(true);
    expect(desk.agents.map((agent) => agent.name)).toEqual([
      "Front Desk Router",
      "Research Watcher",
      "QA Verifier",
    ]);
    expect(desk.tasks).toHaveLength(3);
    expect(desk.scenarios.map((scenario) => scenario.id)).toEqual([
      "corridor-brief",
      "front-desk-triage",
    ]);
  });
});

describe("openReplay", () => {
  it("opens a finished rehearsal and clamps partial cursors", () => {
    const full = openReplay({ scenario: "corridor-brief", at: "full" });
    expect(full?.cursor).toBe(full?.plan.events.length);
    const partial = openReplay({ scenario: ["front-desk-triage"], at: ["2"] });
    expect(partial?.cursor).toBe(2);
    const negative = openReplay({ scenario: "corridor-brief", at: "-3" });
    expect(negative?.cursor).toBe(0);
    expect(openReplay({ scenario: "missing", at: "full" })).toBeNull();
    expect(openReplay({ scenario: "corridor-brief" })).toBeNull();
  });
});

describe("formatOffset", () => {
  it("prints minute-stable trace clocks", () => {
    expect(formatOffset(0)).toBe("00:00.0");
    expect(formatOffset(640)).toBe("00:00.6");
    expect(formatOffset(61_200)).toBe("01:01.2");
  });
});
