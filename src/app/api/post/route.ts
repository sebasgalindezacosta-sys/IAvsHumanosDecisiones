import { NextResponse } from "next/server";
import { q } from "@/lib/db";
import { getParticipant } from "@/lib/session";
import { pathFor } from "@/lib/flow";
import { OPCIONES } from "@/data/textos";

export const dynamic = "force-dynamic";

const pick = (v: unknown, opts: readonly string[]) => (typeof v === "string" && opts.includes(v) ? v : null);
const likert = (v: unknown) => (Number.isInteger(v) && (v as number) >= 1 && (v as number) <= 7 ? (v as number) : null);

/** Cuestionario final: chequeo de manipulación + uso de IA (variable extraña) + criterios de exclusión. */
export async function POST(req: Request) {
  const p = await getParticipant();
  if (!p) return NextResponse.json({ ok: false, error: "sin sesión" }, { status: 401 });
  if (p.current_step !== "post") return NextResponse.json({ ok: true, next: pathFor(p.current_step) });

  const b = await req.json().catch(() => ({}));
  const withRec = p.condition !== "control";
  const d = {
    manip: pick(b.manipCheck, OPCIONES.manipCheck),
    considered: withRec ? likert(b.recConsidered) : null,
    trust: withRec ? likert(b.recTrust) : null,
    aiEver: pick(b.aiEver, OPCIONES.siNo),
    aiFreq: pick(b.aiFreq, OPCIONES.frecuenciaIA),
    aiTraining: pick(b.aiTraining, OPCIONES.siNo),
    prior: pick(b.priorStudies, OPCIONES.estudiosPrevios),
    knew: pick(b.knewDesign, OPCIONES.siNo),
  };
  const required = [d.manip, d.aiEver, d.aiFreq, d.aiTraining, d.prior, d.knew, ...(withRec ? [d.considered, d.trust] : [])];
  if (required.some((v) => v === null)) {
    return NextResponse.json({ ok: false, error: "Faltan respuestas." }, { status: 400 });
  }
  const guess = typeof b.guessPurpose === "string" ? b.guessPurpose.trim().slice(0, 500) || null : null;

  await q(
    `UPDATE participants SET manip_check=$2, rec_considered=$3, rec_trust=$4, ai_ever=$5, ai_freq=$6,
       ai_training=$7, prior_studies=$8, knew_design=$9, guess_purpose=$10,
       finished_at=now(), current_step='done', updated_at=now()
     WHERE id=$1`,
    [p.id, d.manip, d.considered, d.trust, d.aiEver, d.aiFreq, d.aiTraining, d.prior, d.knew, guess],
  );
  return NextResponse.json({ ok: true, next: pathFor("done") });
}
