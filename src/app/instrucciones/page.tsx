import { guard } from "@/lib/session";
import { presentacionAgente, INSTRUCCIONES_COMUNES } from "@/data/textos";
import { avatarFor } from "@/data/estudio";
import { InstructionsClient } from "./InstructionsClient";

export const dynamic = "force-dynamic";

export default async function Page() {
  const p = await guard("instructions");
  const condition = p.condition ?? "control";
  const agent = presentacionAgente(condition);
  return (
    <InstructionsClient
      comunes={INSTRUCCIONES_COMUNES}
      agent={agent && condition !== "control" ? { ...agent, avatar: avatarFor(condition, p.human_gender) } : null}
    />
  );
}
