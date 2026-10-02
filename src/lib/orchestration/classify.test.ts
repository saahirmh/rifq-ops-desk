import { describe, expect, it } from "vitest";
import { classifyInbound } from "./classify";

describe("classifyInbound", () => {
  it("treats empty notes as unclassified", () => {
    expect(classifyInbound("")).toBe("unclassified");
    expect(classifyInbound("   ")).toBe("unclassified");
  });

  it("routes corridor language to research", () => {
    expect(
      classifyInbound(
        "A partner asked whether the sample corridor watch changed this week.",
      ),
    ).toBe("research_brief");
  });

  it("lets billing win over research", () => {
    expect(classifyInbound("Send the invoice for the research brief.")).toBe("billing");
  });

  it("lets scheduling win over research", () => {
    expect(classifyInbound("Book a call to review the research brief.")).toBe("scheduling");
  });

  it("holds small talk", () => {
    expect(classifyInbound("Hello there, thanks for the note.")).toBe("unclassified");
  });
});
