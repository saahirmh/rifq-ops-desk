import { formatTraceStatus } from "@/lib/format";
import type { TraceEvent } from "@/lib/orchestration";

export function TraceInspector({
  event,
  agentName,
}: {
  event: TraceEvent | null;
  agentName: string | null;
}) {
  return (
    <section className="max-h-[240px] shrink-0 overflow-auto border-t border-line bg-ink/35">
      <header className="flex items-center justify-between gap-3 px-4 py-2.5">
        <div>
          <p className="font-mono text-[10px] tracking-[0.18em] text-faint">TOOL TRACE</p>
          <h3 className="text-sm font-medium">
            {event ? event.title : "Nothing selected"}
          </h3>
        </div>
        {event ? (
          <p className="text-right font-mono text-[10px] text-muted">
            {agentName} · {event.tool ?? event.kind} · {event.durationMs} ms ·{" "}
            {formatTraceStatus(event.status)} · sample
          </p>
        ) : null}
      </header>
      {event ? (
        <div className="grid gap-3 px-4 pb-4 lg:grid-cols-2">
          <Payload label="Output" value={event.output} />
          <Payload label="Input" value={event.input} />
        </div>
      ) : (
        <p className="px-4 pb-4 text-xs leading-5 text-muted">
          Select a trace to read its input and output. Payloads in this rehearsal are fixtures.
        </p>
      )}
    </section>
  );
}

function Payload({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="min-w-0">
      <p className="font-mono text-[10px] tracking-[0.16em] text-faint">{label.toUpperCase()}</p>
      <pre className="mt-1.5 max-h-36 overflow-auto rounded-md border border-line bg-panel px-3 py-2 font-mono text-[11px] leading-5 text-paper/90">
        {value === undefined ? "—" : JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}
