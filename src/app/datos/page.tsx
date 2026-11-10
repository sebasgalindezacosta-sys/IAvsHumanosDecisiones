import { guard } from "@/lib/session";
import { DemographicsForm } from "./DemographicsForm";

export const dynamic = "force-dynamic";

export default async function Page() {
  await guard("demographics");
  return <DemographicsForm />;
}
