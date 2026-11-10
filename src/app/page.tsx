import { getParticipant } from "@/lib/session";
import { pathFor } from "@/lib/flow";
import { Landing } from "./Landing";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  let existing: { step: string; next: string } | null = null;
  let dbError = false;
  try {
    const p = await getParticipant();
    if (p) existing = { step: p.current_step, next: pathFor(p.current_step) };
  } catch {
    dbError = true;
  }
  return (
    <Landing
      test={sp.test === "1"}
      source={typeof sp.src === "string" ? sp.src : null}
      existing={existing}
      dbError={dbError}
    />
  );
}
