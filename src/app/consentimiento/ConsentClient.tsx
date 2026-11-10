"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shell, Title } from "@/components/Shell";
import { Button, ErrorText } from "@/components/ui";
import { CONSENT_DECLARATION, CONSENT_SECTIONS } from "@/data/textos";
import { postJson, SAVE_ERROR } from "@/lib/postJson";
import { PROGRESS } from "@/lib/flow";

export function ConsentClient() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function answer(accept: boolean) {
    setBusy(true);
    setError(null);
    const r = await postJson<{ next: string }>("/api/consent", { accept });
    if (!r?.next) {
      setBusy(false);
      setError(SAVE_ERROR);
      return;
    }
    router.push(r.next);
  }

  return (
    <Shell progress={PROGRESS.consent} step="Consentimiento informado">
      <Title>Consentimiento informado</Title>
      <div className="max-w-measure space-y-4 text-[15.5px] leading-relaxed">
        {CONSENT_SECTIONS.map((s) => (
          <p key={s.titulo}>
            <strong className="text-ink">{s.titulo}.</strong> <span className="text-ink/85">{s.texto}</span>
          </p>
        ))}
        <p className="rounded-md border border-line bg-card p-4 text-ink">
          <strong>Declaración de consentimiento.</strong> {CONSENT_DECLARATION}
        </p>
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button onClick={() => answer(true)} disabled={busy}>
          Acepto participar
        </Button>
        <Button variant="ghost" onClick={() => answer(false)} disabled={busy}>
          No acepto participar
        </Button>
      </div>
      <ErrorText>{error}</ErrorText>
    </Shell>
  );
}
