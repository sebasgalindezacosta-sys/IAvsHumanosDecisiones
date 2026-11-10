import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { q } from "./db";
import { pathFor, type Step } from "./flow";
import type { Condition, HumanGender } from "@/data/estudio";
import type { CbSet, PlannedTrial } from "./trialPlan";

export const COOKIE = "pid";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface Participant {
  id: string;
  code: string;
  is_test: boolean;
  current_step: Step;
  condition: Condition | null;
  cb_set: CbSet | null;
  human_gender: HumanGender | null;
  trial_plan: PlannedTrial[] | null;
}

export async function setParticipantCookie(id: string) {
  (await cookies()).set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function getParticipant(): Promise<Participant | null> {
  const id = (await cookies()).get(COOKIE)?.value;
  if (!id || !UUID.test(id)) return null;
  const rows = await q<Participant>(
    "SELECT id, code, is_test, current_step, condition, cb_set, human_gender, trial_plan FROM participants WHERE id = $1",
    [id],
  );
  return rows[0] ?? null;
}

/** Para las páginas: devuelve el participante si está en el paso indicado; si no, lo lleva a su paso. */
export async function guard(...steps: Step[]): Promise<Participant> {
  const p = await getParticipant();
  if (!p) redirect("/");
  if (!steps.includes(p.current_step)) redirect(pathFor(p.current_step));
  return p;
}

export async function setStep(id: string, step: Step) {
  await q("UPDATE participants SET current_step = $2, updated_at = now() WHERE id = $1", [id, step]);
}
