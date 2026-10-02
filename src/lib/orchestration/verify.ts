import type { Claim, FixtureSource, VerificationIssue } from "./types";

export function verifyClaims(
  claims: Claim[],
  sources: FixtureSource[],
): VerificationIssue[] {
  const known = new Set(sources.map((source) => source.id));
  const issues: VerificationIssue[] = [];

  claims.forEach((claim, claimIndex) => {
    const text = claim.text.trim();
    if (!text) {
      issues.push({
        claimIndex,
        code: "empty_claim",
        message: "Claim text is empty.",
      });
      return;
    }
    if (claim.sourceIds.length === 0) {
      issues.push({
        claimIndex,
        code: "missing_source",
        message: `No fixture source cited for: “${text}”`,
      });
      return;
    }
    const unknown = claim.sourceIds.filter((id) => !known.has(id));
    if (unknown.length > 0) {
      issues.push({
        claimIndex,
        code: "unknown_source",
        message: `Unknown fixture source ${unknown.join(", ")} on: “${text}”`,
      });
    }
  });

  return issues;
}

export function approvedClaims(claims: Claim[], issues: VerificationIssue[]): Claim[] {
  const rejected = new Set(issues.map((issue) => issue.claimIndex));
  return claims.filter((_, index) => !rejected.has(index));
}

export function composeReply(claims: Claim[]): string {
  if (claims.length === 0) {
    throw new Error("Cannot compose a reply with no approved claims.");
  }
  const lines = claims.map(
    (claim) => `• ${claim.text} (${claim.sourceIds.join(", ")})`,
  );
  return [
    "Sample desk note — fixture sources only.",
    "",
    ...lines,
    "",
    "Nothing here is a live client update.",
  ].join("\n");
}
