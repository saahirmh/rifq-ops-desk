import { Desk } from "@/components/desk/desk";
import { getDesk, openReplay } from "@/lib/desk";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ scenario?: string | string[]; at?: string | string[] }>;
}) {
  const replay = openReplay(await searchParams);
  return (
    <Desk
      desk={getDesk()}
      initialPlan={replay?.plan ?? null}
      initialCursor={replay?.cursor ?? 0}
    />
  );
}
