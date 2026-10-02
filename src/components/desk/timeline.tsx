"use client";

import { formatOffset, formatTraceStatus } from "@/lib/format";
import type { TraceEvent, TraceStatus } from "@/lib/orchestration";
import { useEffect } from "react";

const tone: Record<TraceStatus, string> = {
  ok: "border-mint bg-mint",
  warn: "border-brass bg-brass",
  error: "border-danger bg-danger",
};

export function Timeline({
  events,
  agentNames,
  selectedId,
  onSelect,
}: {
  events: TraceEvent[];
  agentNames: Record<string, string>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  useEffect(() => {
    if (!selectedId) return;
    document.getElementById(`trace-${selectedId}`)?.scrollIntoView({ block: "center" });
  }, [selectedId, events.length]);

  if (events.length === 0) {
    return (
      <div className="flex flex-1 flex-col justify-center px-6 py-8">
        <p className="font-mono text-[10px] tracking-[0.18em] text-brass">NO TRACE YET</p>
        <h3 className="mt-3 max-w-md text-2xl font-medium tracking-tight">The desk is clear.</h3>
        <p className="mt-2 max-w-md text-sm leading-6 text-muted">
          Run a sample cycle to watch a fixture note move across the roster. Tool payloads stay
          on the timeline. Nothing is sent.
        </p>
        <div className="mt-6 flex items-center gap-3 text-xs text-faint">
          <span className="h-2.5 w-2.5 rounded-full border border-brass bg-ink" />
          <span className="h-px w-16 bg-line" />
          <span>Intake</span>
          <span className="h-px w-8 bg-line" />
          <span>Shelf</span>
          <span className="h-px w-8 bg-line" />
          <span>QA</span>
        </div>
      </div>
    );
  }

  return (
    <ol className="relative min-h-0 flex-1 space-y-1 overflow-auto px-3 py-3">
      <span aria-hidden className="absolute bottom-4 left-[27px] top-5 w-px bg-line" />
      {events.map((event) => {
        const selected = event.id === selectedId;
        return (
          <li key={event.id} id={`trace-${event.id}`} className="trace-in relative">
            <span
              aria-hidden
              className={`absolute left-3 top-4 h-2.5 w-2.5 rounded-full border ${tone[event.status]}`}
            />
            <button
              type="button"
              onClick={() => onSelect(event.id)}
              aria-current={selected ? "true" : undefined}
              className={`ml-7 w-[calc(100%-1.75rem)] rounded-lg border px-3 py-2.5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass ${
                selected ? "border-brass/50 bg-panel-2" : "border-transparent hover:border-line hover:bg-ink/40"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-[10px] tracking-[0.14em] text-brass">
                  {(agentNames[event.agentId] ?? event.agentId).toUpperCase()}
                </span>
                <span className="font-mono text-[10px] tabular-nums text-faint">
                  {formatOffset(event.atMs)} · {formatTraceStatus(event.status)}
                </span>
              </div>
              <p className="mt-1 text-sm font-medium tracking-tight">{event.title}</p>
              <p className="mt-0.5 text-xs leading-5 text-muted">{event.detail}</p>
              {event.tool ? (
                <p className="mt-1.5 font-mono text-[10px] text-faint">{event.tool}</p>
              ) : null}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
