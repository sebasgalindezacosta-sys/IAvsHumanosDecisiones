import { guard } from "@/lib/session";
import { PostForm } from "./PostForm";

export const dynamic = "force-dynamic";

export default async function Page() {
  const p = await guard("post");
  return <PostForm withRec={p.condition !== "control"} />;
}
