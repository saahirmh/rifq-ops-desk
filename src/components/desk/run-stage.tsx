import type { RunOutcome, RunPlan, ScenarioSummary, TraceEvent } from "@/lib/orchestration";
import { Timeline } from "./timeline";
import { TraceInspector } from "./trace-inspector";

const outcomeCopy: Record<RunOutcome, { label: string; tone: string }> = {
  completed: { label: "Rehearsal complete", tone: "text-mint border-mint/40 bg-mint/10" },
  needs_review: { label: "Held for a human", tone: "text-brass border-brass/40 bg-brass/10" },
  failed: { label: "Stopped before send", tone: "text-danger border-danger/40 bg-danger/10" },
};

export function RunStage({
  scenarios,
  scenarioId,
  onScenario,
  plan,
  visible,
  settled,
  playing,
  pending,
  error,
  counts,
  selected,
  agentNames,
  onSelect,
  onPrimary,
  onStep,
  onReset,
  primaryLabel,
  canStep,
}: {
  scenarios: ScenarioSummary[];
  scenarioId: string;
  onScenario: (id: string) => void;
  plan: RunPlan | null;
  visible: TraceEvent[];
  settled: boolean;
  playing: boolean;
  pending: boolean;
  error: string | null;
  counts: { traces: number; handoffs: number; warnings: number } | null;
  selected: TraceEvent | null;
  agentNames: Record<string, string>;
  onSelect: (id: string) => void;
  onPrimary: () => void;
  onStep: () => void;
  onReset: () => void;
  primaryLabel: string;
  canStep: boolean;
}) {
  const armed = scenarios.find((scenario) => scenario.id === scenarioId) ?? scenarios[0];
  const outcome = plan && settled ? outcomeCopy[plan.outcome] : null;

  return (
    <section className="flex h-full min-h-[70vh] min-w-0 flex-col overflow-hidden rounded-xl border border-line bg-panel/90 lg:min-h-0">
      <div className="shrink-0 border-b border-line px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-xl">
            <p className="font-mono text-[10px] tracking-[0.18em] text-faint">SAMPLE CYCLE</p>
            <h2 className="mt-1 text-lg font-medium tracking-tight">
              {plan ? plan.title : "Run the desk"}
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              {plan ? plan.summary : armed?.summary}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onPrimary}
              disabled={pending}
              className="inline-flex h-10 items-center justify-center rounded-md bg-brass px-4 text-sm font-medium text-ink transition hover:bg-brass-2 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
            >
              {primaryLabel}
            </button>
            {plan ? (
              <>
                <button
                  type="button"
                  onClick={onStep}
                  disabled={!canStep}
                  className="inline-flex h-10 items-center justify-center rounded-md border border-line bg-ink/40 px-3 text-sm text-paper transition hover:border-brass/50 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
                >
                  Step
                </button>
                <button
                  type="button"
                  onClick={onReset}
                  className="inline-flex h-10 items-center justify-center rounded-md border border-line bg-ink/40 px-3 text-sm text-paper transition hover:border-brass/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
                >
                  Reset
                </button>
              </>
            ) : null}
          </div>
        </div>

        <div
          role="radiogroup"
          aria-label="Sample scenario"
          className="mt-4 grid gap-2 md:grid-cols-2"
        >
          {scenarios.map((scenario) => {
            const selectedScenario = scenario.id === scenarioId;
            return (
              <button
                key={scenario.id}
                type="button"
                role="radio"
                aria-checked={selectedScenario}
                disabled={playing}
                onClick={() => onScenario(scenario.id)}
                className={`rounded-lg border px-3 py-2 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass disabled:cursor-not-allowed disabled:opacity-60 ${
                  selectedScenario
                    ? "border-brass/60 bg-brass/10"
                    : "border-line bg-ink/30 hover:border-brass/30"
                }`}
              >
                <span className="block text-sm font-medium">{scenario.title}</span>
                {plan ? null : (
                  <span className="mt-0.5 block text-xs leading-5 text-muted">{scenario.summary}</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
          {outcome ? (
            <span className={`rounded-full border px-2 py-0.5 font-mono tracking-wide ${outcome.tone}`}>
              {outcome.label}
            </span>
          ) : (
            <span className="font-mono tracking-[0.14em] text-faint">
              {playing ? "REHEARSAL IN PROGRESS" : "WAITING"}
            </span>
          )}
          {plan ? (
            <span className="font-mono tabular-nums text-muted">
              {visible.length}/{plan.events.length} traces
              {counts
                ? ` · ${counts.handoffs} handoffs · ${counts.warnings} flags`
                : ""}
            </span>
          ) : (
            <span className="text-muted">Fixture rehearsal. No API key. No model call.</span>
          )}
        </div>
        {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
        <p className="sr-only" aria-live="polite">
          {playing
            ? `Rehearsal in progress, trace ${visible.length}`
            : outcome
              ? outcome.label
              : "Desk idle"}
        </p>
      </div>

      {plan?.reply && settled ? (
        <blockquote className="border-b border-line bg-mint/5 px-4 py-3">
          <p className="font-mono text-[10px] tracking-[0.16em] text-mint">SAMPLE REPLY · NOT SENT</p>
          <pre className="mt-2 max-h-28 overflow-auto whitespace-pre-wrap font-mono text-[12px] leading-5 text-paper/90">
            {plan.reply}
          </pre>
        </blockquote>
      ) : null}

      <Timeline
        events={visible}
        agentNames={agentNames}
        selectedId={selected?.id ?? null}
        onSelect={onSelect}
      />
      <TraceInspector event={selected} agentName={selected ? (agentNames[selected.agentId] ?? null) : null} />
    </section>
  );
}
