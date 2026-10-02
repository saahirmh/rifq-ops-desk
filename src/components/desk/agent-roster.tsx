import type { Agent, AgentStatus } from "@/lib/orchestration";

const lamp: Record<AgentStatus, string> = {
  idle: "bg-faint/70",
  live: "bg-mint lamp-live",
  review: "bg-brass",
  done: "bg-mint/80",
};

export function AgentRoster({
  agents,
  statuses,
  settled,
}: {
  agents: Agent[];
  statuses: Record<string, AgentStatus>;
  settled: boolean;
}) {
  return (
    <section className="flex h-full min-h-[70vh] min-w-0 flex-col overflow-hidden rounded-xl border border-line bg-panel/90 lg:min-h-0">
      <header className="border-b border-line px-4 py-3">
        <p className="font-mono text-[10px] tracking-[0.18em] text-faint">SAMPLE ROSTER</p>
        <h2 className="mt-1 text-sm font-medium">Agents on this desk</h2>
        <p className="mt-1 text-xs text-muted">Intake, then the shelf, then the check.</p>
      </header>
      <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto p-3">
        {agents.map((agent) => {
          const status = statuses[agent.id] ?? "idle";
          return (
            <li
              key={agent.id}
              className={`rounded-lg border bg-ink/40 p-3 ${
                status === "live" || status === "review"
                  ? "border-brass/60"
                  : "border-line"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-medium tracking-tight">{agent.name}</h3>
                  <p className="mt-0.5 font-mono text-[10px] tracking-[0.14em] text-brass">
                    {agent.role.toUpperCase()}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-wide text-muted">
                  <span className={`h-1.5 w-1.5 rounded-full ${lamp[status]}`} />
                  {labelFor(status, settled)}
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-muted">{agent.mandate}</p>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {agent.tools.map((tool) => (
                  <li
                    key={tool}
                    className="rounded border border-line bg-panel-2 px-1.5 py-0.5 font-mono text-[10px] text-paper/80"
                  >
                    {tool}
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
      <p className="border-t border-line px-4 py-3 text-[11px] leading-5 text-faint">
        Rifq is a trading brand of Saba Technologies Ltd. This roster is a fixture, not a live client desk.
      </p>
    </section>
  );
}

function labelFor(status: AgentStatus, settled: boolean): string {
  if (status === "done" && !settled) return "Handed off";
  if (status === "live") return "Live";
  if (status === "review") return "Review";
  if (status === "done") return "Done";
  return "Idle";
}
