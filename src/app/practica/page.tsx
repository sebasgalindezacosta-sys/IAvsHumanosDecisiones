import { guard } from "@/lib/session";
import { PRACTICE } from "@/data/items";
import { LOCK_MS } from "@/data/estudio";
import type { TrialView } from "@/components/TrialScreen";
import { PracticeClient } from "./PracticeClient";

export const dynamic = "force-dynamic";

export default async function Page() {
  await guard("practice");
  const trial: TrialView = {
    itemId: PRACTICE.id,
    situacion: PRACTICE.situacion,
    left: { label: PRACTICE.o1.label, img: PRACTICE.o1.img },
    right: { label: PRACTICE.o2.label, img: PRACTICE.o2.img },
    rec: null,
  };
  return <PracticeClient trial={trial} lockMs={LOCK_MS} />;
}
