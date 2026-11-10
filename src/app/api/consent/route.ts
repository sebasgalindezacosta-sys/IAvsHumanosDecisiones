import { NextResponse } from "next/server";
import { q } from "@/lib/db";
import { getParticipant } from "@/lib/session";
import { pathFor } from "@/lib/flow";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const p = await getParticipant();
  if (!p) return NextResponse.json({ ok: false, error: "sin sesión" }, { status: 401 });
  if (p.current_step !== "consent") return NextResponse.json({ ok: true, next: pathFor(p.current_step) });

  const b = await req.json().catch(() => ({}));
  const accept = b.accept === true;
  const next = accept ? "demographics" : "declined";
  await q(
    `UPDATE participants SET consent = $2, consent_at = now(), current_step = $3, updated_at = now() WHERE id = $1`,
    [p.id, accept, next],
  );
  return NextResponse.json({ ok: true, next: pathFor(next) });
}
