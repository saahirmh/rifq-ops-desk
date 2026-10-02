"use client";

import { deriveAgentStatuses, deriveTasks, summarizePlan } from "@/lib/orchestration";
import type { DeskSnapshot, RunPlan } from "@/lib/orchestration";
import { useEffect, useRef, useState } from "react";
import { AgentRoster } from "./agent-roster";
import { Header } from "./header";
import { RunStage } from "./run-stage";
import { TaskQueue } from "./task-queue";

export function Desk({
  desk,
  initialPlan,
  initialCursor,
}: {
  desk: DeskSnapshot;
  initialPlan: RunPlan | null;
  initialCursor: number;
}) {
  const timerRef = useRef<number | null>(null);
  const [plan, setPlan] = useState<RunPlan | null>(initialPlan);
  const [cursor, setCursor] = useState(initialCursor);
  const [playing, setPlaying] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scenarioId, setScenarioId] = useState(
    initialPlan?.scenarioId ?? desk.scenarios[0]?.id ?? "corridor-brief",
  );
  const [selectedId, setSelectedId] = useState<string | null>(preferSelection(initialPlan, initialCursor));

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  function clearTimer() {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function reveal(nextPlan: RunPlan, from: number) {
    clearTimer();
    const tick = (current: number) => {
      if (current >= nextPlan.events.length) {
        timerRef.current = null;
        setPlaying(false);
        return;
      }
      const wait = current === 0 ? 280 : 760;
      timerRef.current = window.setTimeout(() => {
        const next = current + 1;
        const event = nextPlan.events[next - 1];
        setCursor(next);
        if (event) setSelectedId(event.id);
        tick(next);
      }, wait);
    };
    setPlaying(true);
    tick(from);
  }

  async function start() {
    clearTimer();
    setPlaying(false);
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId }),
      });
      const payload: unknown = await response.json();
      if (!response.ok || !isPlan(payload)) {
        throw new Error(errorMessage(payload));
      }
      setPlan(payload);
      setCursor(0);
      setSelectedId(null);
      setPending(false);
      reveal(payload, 0);
    } catch (caught) {
      setPending(false);
      setPlaying(false);
      setError(caught instanceof Error ? caught.message : "The desk could not start that cycle.");
    }
  }

  function pause() {
    clearTimer();
    setPlaying(false);
  }

  function step() {
    if (!plan || cursor >= plan.events.length) return;
    clearTimer();
    setPlaying(false);
    const next = cursor + 1;
    setCursor(next);
    const event = plan.events[next - 1];
    if (event) setSelectedId(event.id);
  }

  function reset() {
    clearTimer();
    setPlaying(false);
    setPlan(null);
    setCursor(0);
    setSelectedId(null);
    setError(null);
  }

  const visible = plan ? plan.events.slice(0, cursor) : [];
  const settled = Boolean(plan && cursor >= plan.events.length && plan.events.length > 0);
  const latest = visible[visible.length - 1];
  const atMs = latest ? latest.atMs : null;
  const tasks = deriveTasks(desk.tasks, plan?.taskEffects ?? [], atMs);
  const statuses = deriveAgentStatuses(desk.agents, visible, settled);
  const selected = visible.find((event) => event.id === selectedId) ?? null;
  const armed = desk.scenarios.find((scenario) => scenario.id === scenarioId);
  const counts = plan ? summarizePlan(visible) : null;
  const agentNames = Object.fromEntries(desk.agents.map((agent) => [agent.id, agent.name]));

  const primaryLabel = pending
    ? "Starting…"
    : playing
      ? "Pause"
      : plan && cursor < plan.events.length && cursor > 0
        ? "Resume"
        : plan && settled
          ? "Run again"
          : "Run sample cycle";

  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto grid w-full max-w-[1500px] flex-1 gap-3 px-3 py-3 lg:h-[calc(100vh-4rem)] lg:grid-cols-[300px_minmax(0,1fr)_332px] lg:grid-rows-[minmax(0,1fr)] lg:overflow-hidden lg:px-4">
        <div className="order-3 min-h-0 lg:order-1 lg:h-full">
          <AgentRoster agents={desk.agents} statuses={statuses} settled={settled} />
        </div>
        <div className="order-1 min-h-0 lg:order-2 lg:h-full">
          <RunStage
            scenarios={desk.scenarios}
            scenarioId={scenarioId}
            onScenario={setScenarioId}
            plan={plan}
            visible={visible}
            settled={settled}
            playing={playing}
            pending={pending}
            error={error}
            counts={counts}
            selected={selected}
            agentNames={agentNames}
            onSelect={(id) => {
              pause();
              setSelectedId(id);
            }}
            onPrimary={() => {
              if (playing) {
                pause();
                return;
              }
              if (plan && cursor < plan.events.length && cursor > 0) {
                reveal(plan, cursor);
                return;
              }
              void start();
            }}
            onStep={step}
            onReset={reset}
            primaryLabel={primaryLabel}
            canStep={Boolean(plan) && cursor < (plan?.events.length ?? 0)}
          />
        </div>
        <div className="order-2 min-h-0 lg:order-3 lg:h-full">
          <TaskQueue
            tasks={tasks}
            focusTaskId={armed?.taskId ?? null}
            agentNames={agentNames}
          />
        </div>
      </main>
    </div>
  );
}

function preferSelection(plan: RunPlan | null, cursor: number): string | null {
  if (!plan || cursor <= 0) return null;
  const visible = plan.events.slice(0, cursor);
  return (visible.find((event) => event.status === "warn") ?? visible.at(-1))?.id ?? null;
}

function isPlan(value: unknown): value is RunPlan {
  return (
    typeof value === "object" &&
    value !== null &&
    "events" in value &&
    Array.isArray(value.events) &&
    "scenarioId" in value
  );
}

function errorMessage(value: unknown): string {
  if (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof value.error === "string" &&
    value.error
  ) {
    return value.error;
  }
  return "The desk could not start that cycle.";
}
