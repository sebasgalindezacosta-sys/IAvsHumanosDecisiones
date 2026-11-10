import { guard } from "@/lib/session";
import { q } from "@/lib/db";
import { itemById, recommendationText } from "@/data/items";
import { LOCK_MS, avatarFor } from "@/data/estudio";
import type { TrialView } from "@/components/TrialScreen";
import { TrialsClient } from "./TrialsClient";

export const dynamic = "force-dynamic";

/**
 * Arma en el servidor SOLO las situaciones pendientes, en el orden del plan.
 * En el grupo control no se envía nada sobre la opción meta al navegador.
 */
export default async function Page() {
  const p = await guard("trials");
  const plan = p.trial_plan ?? [];
  const done = await q<{ item_id: string }>(
    "SELECT item_id FROM trials WHERE participant_id = $1 AND block = 'main'",
    [p.id],
  );
  const doneIds = new Set(done.map((r) => r.item_id));
  const condition = p.condition ?? "control";

  const pending: TrialView[] = plan
    .filter((t) => !doneIds.has(t.itemId))
    .map((t) => {
      const item = itemById(t.itemId)!;
      return {
        itemId: t.itemId,
        situacion: item.situacion,
        left: { label: item[t.left].label, img: item[t.left].img },
        right: { label: item[t.right].label, img: item[t.right].img },
        rec:
          condition === "control"
            ? null
            : {
                agent: condition,
                avatar: avatarFor(condition, p.human_gender),
                text: recommendationText(item, t.target),
                side: t.targetSide,
              },
      };
    });

  return <TrialsClient trials={pending} doneCount={plan.length - pending.length} total={plan.length} lockMs={LOCK_MS} />;
}
