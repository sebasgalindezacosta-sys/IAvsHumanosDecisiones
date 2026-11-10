import { NextResponse } from "next/server";
import { q } from "@/lib/db";
import { getParticipant, setStep } from "@/lib/session";
import { deriveTrial } from "@/lib/trialPlan";
import { PRACTICE } from "@/data/items";

export const dynamic = "force-dynamic";

const int = (v: unknown, min = 0, max = 3_600_000): number | null => {
  const n = typeof v === "number" ? v : Number.NaN;
  return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n))) : null;
};

/**
 * Guarda UN ensayo. El navegador solo envía la posición del control y los
 * tiempos; la elección, la congruencia y la posición "hacia la meta" se
 * calculan aquí con el plan guardado (el navegador del grupo control nunca
 * conoce su opción meta).
 */
export async function POST(req: Request) {
  const p = await getParticipant();
  if (!p) return NextResponse.json({ ok: false, error: "sin sesión" }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const block = b.block === "practice" ? "practice" : "main";
  const slider = int(b.sliderValue, -100, 100);
  if (slider === null || slider === 0) {
    return NextResponse.json({ ok: false, error: "posición del control no válida" }, { status: 400 });
  }

  let planned: { i: number; itemId: string; left: "o1" | "o2"; right: "o1" | "o2"; target?: "o1" | "o2"; targetSide?: "left" | "right" };
  if (block === "practice") {
    if (p.current_step === "trials") return NextResponse.json({ ok: true, done: false }); // reintento duplicado
    if (p.current_step !== "practice") return NextResponse.json({ ok: false, error: "paso incorrecto" }, { status: 409 });
    planned = { i: 0, itemId: PRACTICE.id, left: "o1", right: "o2" };
  } else {
    if (p.current_step === "post") return NextResponse.json({ ok: true, done: true }); // reintento duplicado
    if (p.current_step !== "trials" || !p.trial_plan) {
      return NextResponse.json({ ok: false, error: "paso incorrecto" }, { status: 409 });
    }
    const found = p.trial_plan.find((t) => t.itemId === b.itemId);
    if (!found) return NextResponse.json({ ok: false, error: "situación desconocida" }, { status: 400 });
    planned = found;
  }

  const trajectory: [number, number][] = Array.isArray(b.trajectory)
    ? b.trajectory
        .slice(0, 800)
        .filter((pt: unknown) => Array.isArray(pt) && pt.length === 2)
        .map((pt: unknown[]) => [int(pt[0], -100_000, 3_600_000) ?? 0, int(pt[1], -100, 100) ?? 0] as [number, number])
    : [];

  const d = deriveTrial(planned, slider, trajectory);

  await q(
    `INSERT INTO trials (
       participant_id, block, trial_index, item_id, condition, cb_set,
       target_option, target_side, left_option, right_option,
       slider_value, choice_option, choice_side, congruent, toward_target, strength,
       rt_ms, first_move_ms, onset_to_confirm_ms, lock_ms, moves, switches,
       max_toward_target, min_toward_target, trajectory, pointer_type, away_ms, img_error,
       viewport_w, viewport_h, img_px)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25::jsonb,$26,$27,$28,$29,$30,$31)
     ON CONFLICT (participant_id, block, item_id) DO NOTHING`,
    [
      p.id,
      block,
      planned.i,
      planned.itemId,
      block === "main" ? p.condition : null,
      block === "main" ? p.cb_set : null,
      planned.target ?? null,
      planned.targetSide ?? null,
      planned.left,
      planned.right,
      slider,
      d.choiceOption,
      d.choiceSide,
      d.congruent,
      d.towardTarget,
      d.strength,
      int(b.rtMs),
      b.firstMoveMs === null ? null : int(b.firstMoveMs),
      int(b.onsetToConfirmMs),
      int(b.lockMs),
      int(b.moves, 0, 100_000),
      d.switches,
      d.maxTowardTarget,
      d.minTowardTarget,
      JSON.stringify(trajectory),
      typeof b.pointerType === "string" ? b.pointerType.slice(0, 12) : null,
      int(b.awayMs),
      b.imgError === true,
      int(b.viewportW, 0, 20000),
      int(b.viewportH, 0, 20000),
      int(b.imgPx, 0, 5000),
    ],
  );

  if (block === "practice") {
    await q(
      `UPDATE participants SET current_step='trials', trials_started_at = now(), updated_at = now() WHERE id = $1`,
      [p.id],
    );
    return NextResponse.json({ ok: true, done: false });
  }

  const [{ n }] = await q<{ n: number }>(
    `SELECT count(*)::int AS n FROM trials WHERE participant_id = $1 AND block = 'main'`,
    [p.id],
  );
  const done = Number(n) >= p.trial_plan!.length;
  if (done) await setStep(p.id, "post");
  else await q(`UPDATE participants SET updated_at = now() WHERE id = $1`, [p.id]);
  return NextResponse.json({ ok: true, done });
}
