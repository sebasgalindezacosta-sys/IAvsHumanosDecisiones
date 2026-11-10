import "server-only";
import { tx } from "./db";
import { MINUTOS_SESION_ACTIVA, type Condition, type HumanGender } from "@/data/estudio";
import { buildTrialPlan, type CbSet } from "./trialPlan";
import { makeSeed } from "./rng";

/**
 * ASIGNACIÓN ALEATORIA BALANCEADA (y a prueba de llegadas simultáneas)
 * ---------------------------------------------------------------------------
 * Cada participante elegible va a la condición con MENOS personas (empates →
 * al azar) y, dentro de ella, al set de contrabalanceo con menos personas.
 * Cuentan los que terminaron y los que están respondiendo ahora (actividad en
 * los últimos MINUTOS_SESION_ACTIVA); quien abandona libera su cupo, así los
 * grupos terminan con el mismo número de casos COMPLETOS (30/30/30).
 *
 * Si un curso entero abre el enlace a la vez, varias personas podrían leer
 * los mismos conteos y caer en el mismo grupo. Para evitarlo, la asignación
 * se hace en una transacción con un candado (pg_advisory_xact_lock): las
 * asignaciones se atienden de una en una, y el conteo, la elección y el
 * guardado ocurren en una sola sentencia.
 *
 * En la condición "humano" también se asigna, balanceado, si la persona que
 * recomienda es un hombre o una mujer (una sola para todo el experimento).
 *
 * Los participantes de prueba (?test=1) se balancean aparte.
 */
const LOCK_KEY = 732601; // número cualquiera, solo identifica este candado

export interface Demographics {
  age: number;
  gender: string;
  education: string;
  occupation: string;
  estrato: string;
  residence: string;
  spanish_fluent: string;
  psych_student: string;
  device_self: string;
}

export async function assignAndSave(
  id: string,
  isTest: boolean,
  d: Demographics,
): Promise<{ condition: Condition; cbSet: CbSet; humanGender: HumanGender | null }> {
  const seed = makeSeed();
  const planA = JSON.stringify(buildTrialPlan(seed, "A"));
  const planB = JSON.stringify(buildTrialPlan(seed, "B"));

  const [, rows] = await tx([
    { text: "SELECT 1 AS ok FROM (SELECT pg_advisory_xact_lock($1::bigint)) AS l", params: [LOCK_KEY] },
    {
      text: `
        WITH counts AS (
          SELECT c.cond, c.cb,
                 (SELECT count(*) FROM participants p
                   WHERE p.condition = c.cond AND p.cb_set = c.cb AND p.is_test = $2
                     AND (p.finished_at IS NOT NULL OR p.updated_at > now() - make_interval(mins => $3::int)))::int AS n
            FROM (VALUES ('control','A'), ('control','B'), ('humano','A'), ('humano','B'), ('ia','A'), ('ia','B')) AS c(cond, cb)
        ),
        chosen_cond AS (
          SELECT cond FROM counts GROUP BY cond ORDER BY sum(n), random() LIMIT 1
        ),
        chosen AS (
          SELECT counts.cond, counts.cb FROM counts JOIN chosen_cond USING (cond) ORDER BY counts.n, random() LIMIT 1
        ),
        -- Solo en la condición "humano": hombre o mujer, el que tenga menos casos dentro de ese set.
        chosen_gender AS (
          SELECT g.gen
            FROM (VALUES ('hombre'), ('mujer')) AS g(gen), chosen
           ORDER BY (SELECT count(*) FROM participants p
                      WHERE p.condition = 'humano' AND p.cb_set = chosen.cb AND p.human_gender = g.gen AND p.is_test = $2
                        AND (p.finished_at IS NOT NULL OR p.updated_at > now() - make_interval(mins => $3::int))),
                    random()
           LIMIT 1
        )
        UPDATE participants SET
          age = $4, gender = $5, education = $6, occupation = $7, estrato = $8, residence = $9,
          spanish_fluent = $10, psych_student = $11, device_self = $12, eligible = true,
          condition = chosen.cond, cb_set = chosen.cb, seed = $13,
          human_gender = CASE WHEN chosen.cond = 'humano' THEN (SELECT gen FROM chosen_gender) END,
          trial_plan = CASE chosen.cb WHEN 'A' THEN $14::jsonb ELSE $15::jsonb END,
          assigned_at = now(), current_step = 'instructions', updated_at = now()
        FROM chosen
        WHERE participants.id = $1
        RETURNING participants.condition, participants.cb_set, participants.human_gender`,
      params: [
        id, isTest, MINUTOS_SESION_ACTIVA,
        d.age, d.gender, d.education, d.occupation, d.estrato, d.residence, d.spanish_fluent, d.psych_student, d.device_self,
        seed, planA, planB,
      ],
    },
  ]);
  const r = rows[0];
  return { condition: r.condition as Condition, cbSet: r.cb_set as CbSet, humanGender: (r.human_gender ?? null) as HumanGender | null };
}
