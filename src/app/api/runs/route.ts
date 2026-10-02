import { planScenario, ScenarioNotFoundError } from "@/lib/orchestration";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Expected JSON." }, { status: 400 });
  }

  const scenarioId =
    typeof body === "object" &&
    body !== null &&
    "scenarioId" in body &&
    typeof body.scenarioId === "string"
      ? body.scenarioId
      : null;

  if (!scenarioId) {
    return Response.json({ error: "scenarioId is required." }, { status: 400 });
  }

  try {
    return Response.json(planScenario(scenarioId));
  } catch (error) {
    if (error instanceof ScenarioNotFoundError) {
      return Response.json({ error: error.message }, { status: 404 });
    }
    throw error;
  }
}
