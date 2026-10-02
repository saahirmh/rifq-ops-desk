import { describe, expect, it } from "vitest";
import { corridorSources } from "./fixtures";
import { approvedClaims, composeReply, verifyClaims } from "./verify";

describe("verifyClaims", () => {
  it("accepts claims that cite the shelf", () => {
    const issues = verifyClaims(
      [{ text: "Wait moved from 18h to 31h.", sourceIds: ["fx-note-014"] }],
      corridorSources,
    );
    expect(issues).toEqual([]);
  });

  it("flags a missing source, an unknown source, and an empty claim", () => {
    const issues = verifyClaims(
      [
        { text: "All carriers have suspended the lane.", sourceIds: [] },
        { text: "A ghost bulletin says otherwise.", sourceIds: ["fx-missing"] },
        { text: "   ", sourceIds: ["fx-note-014"] },
      ],
      corridorSources,
    );
    expect(issues.map((issue) => issue.code)).toEqual([
      "missing_source",
      "unknown_source",
      "empty_claim",
    ]);
  });

  it("drops rejected claims and refuses to compose an empty reply", () => {
    const claims = [
      { text: "Kept.", sourceIds: ["fx-note-014"] },
      { text: "Dropped.", sourceIds: [] },
    ];
    const issues = verifyClaims(claims, corridorSources);
    const approved = approvedClaims(claims, issues);
    expect(approved.map((claim) => claim.text)).toEqual(["Kept."]);
    expect(() => composeReply([])).toThrow(/no approved claims/);
  });
});
