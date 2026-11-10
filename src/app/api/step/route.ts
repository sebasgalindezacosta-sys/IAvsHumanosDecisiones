import { NextResponse } from "next/server";
import { getParticipant, setStep } from "@/lib/session";
import { pathFor } from "@/lib/flow";

export const dynamic = "force-dynamic";

/** Avanza pasos que no guardan datos (instrucciones → práctica). */
export async function POST(req: Request) {
  const p = await getParticipant();
  if (!p) return NextResponse.json({ ok: false, error: "sin sesión" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  if (b.from === "instructions" && p.current_step === "instructions") {
    await setStep(p.id, "practice");
    return NextResponse.json({ ok: true, next: pathFor("practice") });
  }
  return NextResponse.json({ ok: true, next: pathFor(p.current_step) });
}
