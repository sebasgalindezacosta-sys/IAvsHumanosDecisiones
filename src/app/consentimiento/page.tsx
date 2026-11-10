import { guard } from "@/lib/session";
import { ConsentClient } from "./ConsentClient";

export const dynamic = "force-dynamic";

export default async function Page() {
  await guard("consent");
  return <ConsentClient />;
}
