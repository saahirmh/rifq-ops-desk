import type { TaskSource, TaskStatus, TraceStatus } from "./orchestration";

export function formatOffset(ms: number): string {
  const safe = Math.max(0, Math.floor(ms));
  const tenths = Math.floor(safe / 100);
  const minutes = Math.floor(tenths / 600);
  const seconds = Math.floor((tenths % 600) / 10);
  const tenth = tenths % 10;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${tenth}`;
}

export function formatStatus(status: TaskStatus): string {
  switch (status) {
    case "needs_review":
      return "Needs review";
    case "queued":
      return "Queued";
    case "claimed":
      return "Claimed";
    case "running":
      return "Running";
    case "done":
      return "Done";
    case "failed":
      return "Failed";
  }
}

export function formatSource(source: TaskSource): string {
  switch (source) {
    case "whatsapp":
      return "WhatsApp";
    case "research_feed":
      return "Research feed";
    case "manual":
      return "Manual";
  }
}

export function formatTraceStatus(status: TraceStatus): string {
  switch (status) {
    case "ok":
      return "OK";
    case "warn":
      return "Warn";
    case "error":
      return "Error";
  }
}
