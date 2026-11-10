import { NextResponse } from "next/server";
import { q } from "@/lib/db";
import { getParticipant, setParticipantCookie } from "@/lib/session";
import { makeParticipantCode } from "@/lib/rng";
import { pathFor } from "@/lib/flow";

export const dynamic = "force-dynamic";

/**
 * Crea un participante (anónimo) y deja la cookie de sesión.
 * `restart: true` abre una participación NUEVA en el mismo dispositivo
 * (útil si las investigadoras aplican en un mismo computador o celular).
 */
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));

  const existing = await getParticipant();
  if (existing && b.restart !== true) {
    return NextResponse.json({ ok: true, next: pathFor(existing.current_step) });
  }

  const isTest = b.test === true;
  const source = typeof b.source === "string" ? b.source.slice(0, 60) : null;
  const ua = req.headers.get("user-agent")?.slice(0, 400) ?? null;
  const device = b.device && typeof b.device === "object" ? b.device : null;

  let id: string | null = null;
  for (let attempt = 0; attempt < 5 && !id; attempt++) {
    try {
      const rows = await q<{ id: string }>(
        `INSERT INTO participants (code, is_test, source, user_agent, device)
         VALUES ($1, $2, $3, $4, $5::jsonb) RETURNING id`,
        [makeParticipantCode(isTest ? "T" : "P"), isTest, source, ua, device ? JSON.stringify(device) : null],
      );
      id = rows[0].id;
    } catch (e: any) {
      if (!/duplicate key/i.test(String(e?.message))) throw e; // código repetido: se intenta otro
    }
  }
  if (!id) return NextResponse.json({ ok: false }, { status: 500 });

  await setParticipantCookie(id);
  return NextResponse.json({ ok: true, next: "/consentimiento" });
}
