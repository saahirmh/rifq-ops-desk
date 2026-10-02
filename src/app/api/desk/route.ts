import { getDesk } from "@/lib/desk";

export function GET() {
  return Response.json(getDesk());
}
