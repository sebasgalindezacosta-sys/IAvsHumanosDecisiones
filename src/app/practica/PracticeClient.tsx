"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shell } from "@/components/Shell";
import { ErrorText } from "@/components/ui";
import { TrialScreen, type TrialView, type TrialResult } from "@/components/TrialScreen";
import { postJson, SAVE_ERROR } from "@/lib/postJson";
import { PROGRESS } from "@/lib/flow";

export function PracticeClient({ trial, lockMs }: { trial: TrialView; lockMs: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function commit(r: TrialResult) {
    setBusy(true);
    setError(null);
    const res = await postJson("/api/trial", { block: "practice", ...r });
    if (!res) {
      setBusy(false);
      setError(SAVE_ERROR);
      return;
    }
    router.push("/experimento");
  }

  return (
    <Shell progress={PROGRESS.practice} step="Práctica" compact>
      <p className="mb-3 inline-block rounded-full bg-brandSoft px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.1em] text-brand">
        Práctica · no cuenta
      </p>
      <TrialScreen trial={trial} lockMs={lockMs} busy={busy} onCommit={commit} />
      <ErrorText>{error}</ErrorText>
    </Shell>
  );
}
