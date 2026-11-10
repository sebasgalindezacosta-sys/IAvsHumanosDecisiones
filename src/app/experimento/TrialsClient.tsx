"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Shell } from "@/components/Shell";
import { Button, ErrorText } from "@/components/ui";
import { TrialScreen, type TrialView, type TrialResult } from "@/components/TrialScreen";
import { postJson, SAVE_ERROR } from "@/lib/postJson";
import { usePreloadImages } from "@/lib/usePreloadImages";

/** Pausa en blanco entre situaciones (ms): separa limpiamente un ensayo del siguiente. */
const ITI_MS = 350;

export function TrialsClient({
  trials,
  doneCount,
  total,
  lockMs,
}: {
  trials: TrialView[];
  doneCount: number;
  total: number;
  lockMs: number;
}) {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const [blank, setBlank] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = useRef<TrialResult | null>(null);
  usePreloadImages(trials.flatMap((t) => [t.left.img, t.right.img]));

  const trial = trials[idx];
  const position = Math.min(total, doneCount + idx + 1);
  const progress = 0.25 + 0.63 * ((position - 1) / Math.max(1, total));

  async function save(r: TrialResult) {
    pending.current = r;
    setBusy(true);
    setError(null);
    const res = await postJson<{ done: boolean }>("/api/trial", { block: "main", ...r });
    if (!res) {
      setBusy(false);
      setError(SAVE_ERROR);
      return;
    }
    pending.current = null;
    if (res.done || idx + 1 >= trials.length) {
      router.push("/cuestionario");
      return;
    }
    setBlank(true);
    window.scrollTo({ top: 0 });
    window.setTimeout(() => {
      setIdx((i) => i + 1);
      setBusy(false);
      setBlank(false);
    }, ITI_MS);
  }

  if (!trial) {
    return (
      <Shell progress={0.88}>
        <p className="text-muted">Ya respondiste todas las situaciones.</p>
        <div className="mt-6">
          <Button onClick={() => router.push("/cuestionario")}>Continuar</Button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell
      progress={progress}
      step={
        <span data-pos={position}>
          <span className="hidden sm:inline">Situación </span>
          {position} de {total}
        </span>
      }
      compact
    >
      {blank ? (
        <div className="min-h-[60vh]" aria-hidden />
      ) : (
        <TrialScreen key={trial.itemId} trial={trial} lockMs={lockMs} busy={busy} onCommit={save} />
      )}
      {error && (
        <div className="mt-4 text-center">
          <ErrorText>{error}</ErrorText>
          <div className="mt-3">
            <Button variant="ghost" onClick={() => pending.current && save(pending.current)}>
              Reintentar
            </Button>
          </div>
        </div>
      )}
    </Shell>
  );
}
