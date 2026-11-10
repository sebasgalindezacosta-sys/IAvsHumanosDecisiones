import type { Metadata } from "next";
import { AdminClient } from "./AdminClient";

export const metadata: Metadata = { title: "Panel de investigadoras", robots: { index: false, follow: false } };

export default function Page() {
  return <AdminClient />;
}
