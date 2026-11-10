import { NextResponse } from "next/server";
import { q } from "@/lib/db";
import { isAdmin } from "@/lib/admin";
import { MINUTOS_SESION_ACTIVA } from "@/data/estudio";

export const dynamic = "force-dynamic";

/** Resumen en vivo para el panel /admin: cuántos van por grupo. */
export async function GET(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ ok: false, error: "contraseña incorrecta" }, { status: 401 });

  const grupos = await q(
    `SELECT is_test AS prueba, condition AS condicion, cb_set AS set,
            count(*) FILTER (WHERE current_step = 'done')::int AS completos,
            count(*) FILTER (WHERE current_step <> 'done' AND updated_at >  now() - make_interval(mins => $1::int))::int AS en_curso,
            count(*) FILTER (WHERE current_step <> 'done' AND updated_at <= now() - make_interval(mins => $1::int))::int AS abandonados
       FROM participants
      WHERE condition IS NOT NULL
      GROUP BY 1, 2, 3
      ORDER BY 1, 2, 3`,
    [MINUTOS_SESION_ACTIVA],
  );
  const generos = await q(
    `SELECT human_gender AS genero, count(*) FILTER (WHERE current_step = 'done')::int AS completos
       FROM participants WHERE condition = 'humano' AND NOT is_test GROUP BY 1 ORDER BY 1`,
  );
  const embudo = await q(
    `SELECT is_test AS prueba, current_step AS paso, count(*)::int AS n
       FROM participants GROUP BY 1, 2 ORDER BY 1, 2`,
  );
  return NextResponse.json({ ok: true, grupos, generos, embudo, ahora: new Date().toISOString() });
}
