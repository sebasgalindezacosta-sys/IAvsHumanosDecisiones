"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shell, Title } from "@/components/Shell";
import { Button, ErrorText } from "@/components/ui";
import { ESTUDIO } from "@/data/estudio";
import { collectDeviceInfo } from "@/lib/deviceInfo";
import { postJson } from "@/lib/postJson";

const FINISHED = ["done", "declined", "ineligible"];

export function Landing({
  test,
  source,
  existing,
  dbError,
}: {
  test: boolean;
  source: string | null;
  existing: { step: string; next: string } | null;
  dbError: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    dbError ? "El estudio no está disponible en este momento (base de datos sin conectar)." : null,
  );

  async function start(restart: boolean) {
    setBusy(true);
    setError(null);
    const r = await postJson<{ next: string }>("/api/participant", {
      test,
      source,
      restart,
      device: collectDeviceInfo(),
    });
    if (!r?.next) {
      setBusy(false);
      setError("No fue posible iniciar. Revisa tu conexión e inténtalo de nuevo.");
      return;
    }
    router.push(r.next);
  }

  const inProgress = existing && !FINISHED.includes(existing.step) && existing.step !== "consent";
  const finished = existing && FINISHED.includes(existing.step);

  return (
    <Shell>
      {test && (
        <p className="mb-6 rounded-md border border-accent/50 bg-[#fdf6e3] px-3 py-2 text-[14px] text-ink">
          <strong>Modo prueba.</strong> Las respuestas de esta sesión quedan marcadas como prueba y no cuentan para los grupos.
        </p>
      )}
      <Title>{ESTUDIO.titulo}</Title>
      <div className="max-w-measure space-y-4 text-[16px] text-ink/90">
        <p>
          Te invitamos a participar en un estudio académico sobre cómo tomamos las decisiones del día a día. Verás diez
          situaciones cotidianas y en cada una elegirás entre dos opciones.
        </p>
        <p>
          Toma unos {ESTUDIO.duracionMin} y es <strong>anónimo</strong>: no te pediremos nombre, documento ni correo.
          Puedes participar si tienes entre {ESTUDIO.edadMin} y {ESTUDIO.edadMax} años.
        </p>
        <p className="text-[15px] text-muted">
          Te recomendamos responder en un lugar tranquilo, sin interrupciones, desde tu computador o celular.
        </p>
      </div>

      <div className="mt-9 flex flex-wrap items-center gap-3">
        {inProgress ? (
          <>
            <Button onClick={() => router.push(existing!.next)} disabled={busy}>
              Continuar donde quedé
            </Button>
            <Button variant="ghost" onClick={() => start(true)} disabled={busy}>
              Empezar una participación nueva
            </Button>
          </>
        ) : finished ? (
          <>
            <p className="w-full text-[15px] text-muted">Ya hay una participación terminada en este dispositivo. ¡Gracias!</p>
            <Button variant="ghost" onClick={() => start(true)} disabled={busy}>
              Participa otra persona en este dispositivo
            </Button>
          </>
        ) : (
          <Button onClick={() => start(false)} disabled={busy || dbError}>
            {busy ? "Iniciando…" : "Comenzar"}
          </Button>
        )}
      </div>
      <ErrorText>{error}</ErrorText>
    </Shell>
  );
}
