import { classifyInbound } from "./classify";
import type { Agent, RoutingDecision } from "./types";

const RESEARCH_AGENT = "research-watcher";
const DESK_AGENT = "front-desk-router";

function findAgent(agents: Agent[], id: string): Agent | undefined {
  return agents.find((agent) => agent.id === id);
}

/** The router can claim or hold. It cannot mark a note for automatic send. */
export function routeTask(text: string, agents: Agent[]): RoutingDecision {
  const intent = classifyInbound(text);
  const research = findAgent(agents, RESEARCH_AGENT);
  const desk = findAgent(agents, DESK_AGENT);

  if (intent === "research_brief") {
    if (!research) {
      return {
        intent,
        agentId: null,
        autoSend: false,
        queueStatus: "needs_review",
        reason: "Research Watcher is not on the roster, so the desk holds the brief.",
      };
    }
    return {
      intent,
      agentId: research.id,
      autoSend: false,
      queueStatus: "claimed",
      reason:
        "Corridor and research language goes to Research Watcher. A reply waits for QA.",
    };
  }

  if (intent === "scheduling") {
    return {
      intent,
      agentId: desk?.id ?? null,
      autoSend: false,
      queueStatus: "needs_review",
      reason: "Scheduling stays on the front desk. The router does not book.",
    };
  }

  if (intent === "billing") {
    return {
      intent,
      agentId: null,
      autoSend: false,
      queueStatus: "needs_review",
      reason: "Billing language is held for a human. The desk does not answer invoices.",
    };
  }

  return {
    intent,
    agentId: desk?.id ?? null,
    autoSend: false,
    queueStatus: "needs_review",
    reason: "Unclassified notes stay on the front desk.",
  };
}
