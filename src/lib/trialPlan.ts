import { ITEMS, type OptionKey } from "@/data/items";
import { mulberry32, shuffle } from "./rng";

export type Side = "left" | "right";
export type CbSet = "A" | "B";

/**
 * Un ensayo planificado. "target" es la opción META del ensayo:
 *  - en las condiciones IA y persona, es la opción que se RECOMIENDA;
 *  - en el control, es la misma opción pero NO se muestra (sirve para medir
 *    la congruencia de base, que debería rondar el 50 %).
 */
export interface PlannedTrial {
  i: number; // posición 1..10
  itemId: string;
  target: OptionKey;
  targetSide: Side;
  left: OptionKey;
  right: OptionKey;
}

/**
 * CONTRABALANCEO (dentro de cada participante y entre participantes)
 *  1. Orden de las 10 situaciones: aleatorio por participante.
 *  2. Opción meta/recomendada: set A → o1 en ítems impares y o2 en pares;
 *     set B → al revés. Cada participante tiene 5 metas o1 y 5 o2, y dentro de
 *     cada condición la mitad recibe A y la otra mitad B, así cada opción de
 *     cada ítem se recomienda el mismo número de veces.
 *  3. Lado en pantalla de la opción meta: exactamente 5 izquierda y 5 derecha,
 *     en orden aleatorio.
 */
export function buildTrialPlan(seed: number, cbSet: CbSet): PlannedTrial[] {
  const rand = mulberry32(seed);
  const order = shuffle(ITEMS, rand);
  const n = order.length;
  const sides = shuffle<Side>(
    [...Array(Math.ceil(n / 2)).fill("left"), ...Array(Math.floor(n / 2)).fill("right")],
    rand,
  );
  return order.map((item, idx) => {
    const odd = item.numero % 2 === 1;
    const target: OptionKey = (cbSet === "A") === odd ? "o1" : "o2";
    const other: OptionKey = target === "o1" ? "o2" : "o1";
    const targetSide = sides[idx];
    return {
      i: idx + 1,
      itemId: item.id,
      target,
      targetSide,
      left: targetSide === "left" ? target : other,
      right: targetSide === "left" ? other : target,
    };
  });
}

/**
 * Variables derivadas de la posición del control (-100 izquierda … +100 derecha).
 * Se calculan en el SERVIDOR a partir del plan guardado, no en el navegador.
 */
export function deriveTrial(
  plan: Pick<PlannedTrial, "left" | "right"> & Partial<Pick<PlannedTrial, "target" | "targetSide">>,
  slider: number,
  trajectory: [number, number][],
) {
  const choiceSide: Side = slider < 0 ? "left" : "right";
  const choiceOption = choiceSide === "left" ? plan.left : plan.right;
  const hasTarget = !!plan.target && !!plan.targetSide;
  const sign = plan.targetSide === "right" ? 1 : -1;

  const values = [...trajectory.map((p) => p[1]), slider];
  // Cambios de opción: cuántas veces el control cruzó el centro (de una opción a la otra).
  let switches = 0;
  let last = 0;
  for (const v of values) {
    const s = Math.sign(v);
    if (s !== 0) {
      if (last !== 0 && s !== last) switches++;
      last = s;
    }
  }
  const toward = values.map((v) => sign * v);

  return {
    choiceSide,
    choiceOption,
    congruent: hasTarget ? (choiceOption === plan.target ? 1 : 0) : null,
    towardTarget: hasTarget ? sign * slider : null,
    strength: Math.abs(slider),
    switches,
    maxTowardTarget: hasTarget ? Math.max(...toward) : null,
    minTowardTarget: hasTarget ? Math.min(...toward) : null,
  };
}
