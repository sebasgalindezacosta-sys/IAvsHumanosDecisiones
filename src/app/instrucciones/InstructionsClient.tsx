"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shell, Title } from "@/components/Shell";
import { Button, ErrorText } from "@/components/ui";
import { postJson, SAVE_ERROR } from "@/lib/postJson";
import { PROGRESS } from "@/lib/flow";
import { usePreloadImages } from "@/lib/usePreloadImages";
import { ALL_IMAGES } from "@/data/items";
import { AVATARES } from "@/data/estudio";
import { Avatar } from "@/components/RecommendationCard";

export function InstructionsClient({
  comunes,
  agent,
}: {
  comunes: string[];
  agent: { titulo: string; texto: string; avatar: string } | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Se precargan todas las imágenes aquí para que ningún ensayo espere la red.
  usePreloadImages([...ALL_IMAGES, ...Object.values(AVATARES)]);

  async function next() {
    setBusy(true);
    setError(null);
    const r = await postJson<{ next: string }>("/api/step", { from: "instructions" });
    if (!r?.next) {
      setBusy(false);
      setError(SAVE_ERROR);
      return;
    }
    router.push(r.next);
  }

  return (
    <Shell progress={PROGRESS.instructions} step="Instrucciones">
      <Title>Instrucciones</Title>
      <ol className="max-w-measure list-decimal space-y-3 pl-5 text-[16px] text-ink/90">
        {comunes.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ol>

      {agent && (
        <div className="mt-8 flex max-w-measure items-center gap-4 rounded-lg border border-line bg-card p-4 sm:p-5">
          <Avatar src={agent.avatar} className="h-[84px] w-[84px] sm:h-[104px] sm:w-[104px]" />
          <div>
            <p className="font-display text-[19px] leading-snug text-ink">{agent.titulo}</p>
            <p className="mt-1 text-[15px] text-ink/85">{agent.texto}</p>
          </div>
        </div>
      )}

      <p className="mt-8 max-w-measure text-[15px] text-muted">
        Primero harás un ensayo de práctica para conocer el control. Esa respuesta no cuenta.
      </p>
      <div className="mt-5">
        <Button onClick={next} disabled={busy}>
          {busy ? "Un momento…" : "Ir a la práctica"}
        </Button>
      </div>
      <ErrorText>{error}</ErrorText>
    </Shell>
  );
}
