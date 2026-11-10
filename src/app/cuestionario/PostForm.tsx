"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shell, Title, Lead } from "@/components/Shell";
import { Button, Choice, Likert7, ErrorText } from "@/components/ui";
import { OPCIONES } from "@/data/textos";
import { postJson, SAVE_ERROR } from "@/lib/postJson";
import { PROGRESS } from "@/lib/flow";

/**
 * Orden deliberado: primero el chequeo de manipulación (antes de cualquier
 * otra pregunta que nombre la IA), luego la percepción de la recomendación
 * (solo IA y persona), y al final uso de IA y criterios de exclusión.
 */
export function PostForm({ withRec }: { withRec: boolean }) {
  const router = useRouter();
  const [v, setV] = useState<Record<string, string | null>>({
    manipCheck: null,
    aiEver: null,
    aiFreq: null,
    aiTraining: null,
    priorStudies: null,
    knewDesign: null,
  });
  const [considered, setConsidered] = useState<number | null>(null);
  const [trust, setTrust] = useState<number | null>(null);
  const [guess, setGuess] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: string) => (val: string) => setV((s) => ({ ...s, [k]: val }));

  const complete = Object.values(v).every(Boolean) && (!withRec || (considered !== null && trust !== null));

  async function submit() {
    if (!complete) {
      setError("Por favor responde todas las preguntas (la última es opcional).");
      return;
    }
    setBusy(true);
    setError(null);
    const r = await postJson<{ next: string }>("/api/post", {
      ...v,
      recConsidered: considered,
      recTrust: trust,
      guessPurpose: guess,
    });
    if (!r?.next) {
      setBusy(false);
      setError(SAVE_ERROR);
      return;
    }
    router.push(r.next);
  }

  return (
    <Shell progress={PROGRESS.post} step="Preguntas finales">
      <Title>Últimas preguntas</Title>
      <Lead>Ya casi terminas. Responde según lo que recuerdes; no hay respuestas correctas.</Lead>

      <Choice
        name="manipCheck"
        label="Durante las situaciones, ¿quién te daba las recomendaciones?"
        options={OPCIONES.manipCheck}
        value={v.manipCheck}
        onChange={set("manipCheck")}
      />

      {withRec && (
        <>
          <Likert7
            name="recConsidered"
            label="¿Qué tanto tuviste en cuenta las recomendaciones al decidir?"
            low="1 · Nada"
            high="7 · Muchísimo"
            value={considered}
            onChange={setConsidered}
          />
          <Likert7
            name="recTrust"
            label="¿Qué tan confiable te pareció quien hacía las recomendaciones?"
            low="1 · Nada confiable"
            high="7 · Totalmente confiable"
            value={trust}
            onChange={setTrust}
          />
        </>
      )}

      <Choice
        name="aiEver"
        label="¿Has usado alguna vez una herramienta de inteligencia artificial (por ejemplo ChatGPT, Gemini, Copilot o Meta AI)?"
        options={OPCIONES.siNo}
        value={v.aiEver}
        onChange={set("aiEver")}
        inline
      />
      <Choice
        name="aiFreq"
        label="Durante el último mes, ¿con qué frecuencia usaste herramientas de inteligencia artificial?"
        options={OPCIONES.frecuenciaIA}
        value={v.aiFreq}
        onChange={set("aiFreq")}
        inline
      />
      <Choice
        name="aiTraining"
        label="¿Tu formación o tu trabajo están relacionados con la inteligencia artificial o la ciencia de datos?"
        options={OPCIONES.siNo}
        value={v.aiTraining}
        onChange={set("aiTraining")}
        inline
      />
      <Choice
        name="priorStudies"
        label="¿Has participado antes en estudios sobre inteligencia artificial?"
        options={OPCIONES.estudiosPrevios}
        value={v.priorStudies}
        onChange={set("priorStudies")}
        inline
      />
      <Choice
        name="knewDesign"
        label="¿Conocías el objetivo o el diseño de este estudio antes de participar?"
        options={OPCIONES.siNo}
        value={v.knewDesign}
        onChange={set("knewDesign")}
        inline
      />

      <div className="mb-7">
        <label htmlFor="guess" className="block text-[16px] font-medium text-ink mb-1">
          En una frase, ¿de qué crees que se trataba el estudio? <span className="font-normal text-muted">(opcional)</span>
        </label>
        <textarea
          id="guess"
          rows={2}
          maxLength={500}
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          className="mt-1 w-full max-w-measure rounded-md border border-line bg-card px-3 py-2 text-[15px] focus:border-brand"
        />
      </div>

      <Button onClick={submit} disabled={busy}>
        {busy ? "Guardando…" : "Terminar"}
      </Button>
      <ErrorText>{error}</ErrorText>
    </Shell>
  );
}
