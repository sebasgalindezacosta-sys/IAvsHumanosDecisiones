import { NextResponse } from "next/server";
import { q } from "@/lib/db";
import { getParticipant } from "@/lib/session";
import { pathFor } from "@/lib/flow";
import { assignAndSave } from "@/lib/assign";
import { OPCIONES } from "@/data/textos";
import { ESTUDIO } from "@/data/estudio";

export const dynamic = "force-dynamic";

const pick = (v: unknown, opts: readonly string[]) => (typeof v === "string" && opts.includes(v) ? v : null);

/**
 * Guarda los datos sociodemográficos y, si la persona es elegible, le asigna
 * condición + set de contrabalanceo + plan de ensayos. La asignación ocurre
 * AQUÍ (y no al entrar) para que quien no consiente o no es elegible no ocupe
 * un cupo de ningún grupo.
 */
export async function POST(req: Request) {
  const p = await getParticipant();
  if (!p) return NextResponse.json({ ok: false, error: "sin sesión" }, { status: 401 });
  if (p.current_step !== "demographics") return NextResponse.json({ ok: true, next: pathFor(p.current_step) });

  const b = await req.json().catch(() => ({}));
  const age = Number.parseInt(String(b.age), 10);
  const d = {
    gender: pick(b.gender, OPCIONES.genero),
    education: pick(b.education, OPCIONES.educacion),
    occupation: pick(b.occupation, OPCIONES.ocupacion),
    estrato: pick(b.estrato, OPCIONES.estrato),
    residence: pick(b.residence, OPCIONES.residencia),
    spanish_fluent: pick(b.spanishFluent, OPCIONES.siNo),
    psych_student: pick(b.psychStudent, OPCIONES.siNo),
    device_self: pick(b.deviceSelf, OPCIONES.dispositivo),
  };
  if (!Number.isFinite(age) || age < 10 || age > 99 || Object.values(d).some((v) => v === null)) {
    return NextResponse.json({ ok: false, error: "Faltan respuestas o hay un valor no válido." }, { status: 400 });
  }

  const eligible = age >= ESTUDIO.edadMin && age <= ESTUDIO.edadMax && d.spanish_fluent === "Sí";
  const params = [p.id, age, d.gender, d.education, d.occupation, d.estrato, d.residence, d.spanish_fluent, d.psych_student, d.device_self, eligible];

  if (!eligible) {
    await q(
      `UPDATE participants SET age=$2, gender=$3, education=$4, occupation=$5, estrato=$6, residence=$7,
         spanish_fluent=$8, psych_student=$9, device_self=$10, eligible=$11, current_step='ineligible', updated_at=now()
       WHERE id=$1`,
      params,
    );
    return NextResponse.json({ ok: true, next: pathFor("ineligible") });
  }

  // Datos + condición + set + plan de ensayos se guardan juntos, en una transacción con candado.
  await assignAndSave(p.id, p.is_test, { age, ...(d as Record<keyof typeof d, string>) });
  return NextResponse.json({ ok: true, next: pathFor("instructions") });
}
