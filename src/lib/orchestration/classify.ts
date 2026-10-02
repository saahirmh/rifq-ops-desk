import type { Intent } from "./types";

const BILLING = /\b(invoice|invoices|refund|payment|charge|billing|paid)\b/i;
const SCHEDULING = /\b(schedule|scheduling|meeting|calendar|book|booking)\b|\bcall\b/i;
const RESEARCH =
  /\b(brief|research|corridor|source|sources|cite|citation|watcher)\b|\bwhat changed\b/i;

/**
 * Billing wins over scheduling, and scheduling wins over research.
 * Payment and calendar notes stay with a human even if they also mention a brief.
 */
export function classifyInbound(text: string): Intent {
  const value = text.trim();
  if (!value) return "unclassified";
  if (BILLING.test(value)) return "billing";
  if (SCHEDULING.test(value)) return "scheduling";
  if (RESEARCH.test(value)) return "research_brief";
  return "unclassified";
}
