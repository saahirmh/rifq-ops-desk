import { formatSource, formatStatus } from "@/lib/format";
import type { DeskTask, TaskPriority } from "@/lib/orchestration";

const priorityTone: Record<TaskPriority, string> = {
  high: "text-brass",
  normal: "text-muted",
  low: "text-faint",
};

export function TaskQueue({
  tasks,
  focusTaskId,
  agentNames,
}: {
  tasks: DeskTask[];
  focusTaskId: string | null;
  agentNames: Record<string, string>;
}) {
  return (
    <section className="flex h-full min-h-[70vh] min-w-0 flex-col overflow-hidden rounded-xl border border-line bg-panel/90 lg:min-h-0">
      <header className="border-b border-line px-4 py-3">
        <p className="font-mono text-[10px] tracking-[0.18em] text-faint">SAMPLE QUEUE</p>
        <h2 className="mt-1 text-sm font-medium">Waiting notes</h2>
        <p className="mt-1 text-xs text-muted">Fixture inbound. Nothing here was received from a client.</p>
      </header>
      <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto p-3">
        {tasks.map((task) => {
          const focused = task.id === focusTaskId;
          const assignee = task.assignedAgentId
            ? (agentNames[task.assignedAgentId] ?? task.assignedAgentId)
            : "Unassigned";
          return (
            <li key={task.id}>
              <article
                className={`rounded-lg border bg-ink/40 p-3 ${
                  focused ? "border-brass/60" : "border-line"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] tracking-[0.14em] text-faint">
                    SAMPLE · {formatSource(task.source).toUpperCase()}
                  </span>
                  <span className={`font-mono text-[10px] tracking-[0.14em] ${priorityTone[task.priority]}`}>
                    {task.priority.toUpperCase()}
                  </span>
                </div>
                <h3 className="mt-2 text-sm font-medium tracking-tight">{task.title}</h3>
                <p className="mt-1 text-xs leading-5 text-muted">{task.body}</p>
                <div className="mt-3 flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-paper/90">{formatStatus(task.status)}</span>
                  <span className="truncate font-mono text-[10px] text-faint">{assignee}</span>
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
