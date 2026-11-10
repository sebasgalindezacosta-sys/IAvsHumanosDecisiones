"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shell, Title, Lead } from "@/components/Shell";
import { Button, Choice, ErrorText } from "@/components/ui";
import { OPCIONES } from "@/data/textos";
import { postJson, SAVE_ERROR } from "@/lib/postJson";
import { PROGRESS } from "@/lib/flow";

/** Datos generales. Ninguna pregunta menciona la IA (eso va al final). */
export function DemographicsForm() {
  const router = useRouter();
  const [age, setAge] = useState("");
  const [v, setV] = useState<Record<string, string | null>>({
    gender: null,
    education: null,
    occupation: null,
    estrato: null,
    residence: null,
    spanishFluent: null,
    psychStudent: null,
    deviceSelf: null,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: string) => (val: string) => setV((s) => ({ ...s, [k]: val }));

  const ageNum = Number.parseInt(age, 10);
  const complete = Number.isFinite(ageNum) && ageNum > 9 && ageNum < 100 && Object.values(v).every(Boolean);

  async function submit() {
    if (!complete) {
      setError("Por favor responde todas las preguntas.");
      return;
    }
    setBusy(true);
    setError(null);
    const r = await postJson<{ next: string }>("/api/demographics", { age: ageNum, ...v });
    if (!r?.next) {
      setBusy(false);
      setError(SAVE_ERROR);
      return;
    }
    router.push(r.next);
  }

  return (
    <Shell progress={PROGRESS.demographics} step="Datos generales">
      <Title>Algunos datos generales</Title>
      <Lead>Solo para describir a quienes participan. No te pediremos datos que te identifiquen.</Lead>

      <div className="mb-7">
        <label htmlFor="edad" className="block text-[16px] font-medium text-ink mb-2">
          ¿Cuántos años tienes?
        </label>
        <input
          id="edad"
          type="number"
          inputMode="numeric"
          min={10}
          max={99}
          value={age}
          onChange={(e) => setAge(e.target.value.slice(0, 2))}
          className="w-28 rounded-md border border-line bg-card px-3 py-2.5 text-[16px] focus:border-brand"
        />
      </div>

      <Choice name="gender" label="Sexo / género" options={OPCIONES.genero} value={v.gender} onChange={set("gender")} />
      <Choice name="education" label="Máximo nivel educativo (terminado o en curso)" options={OPCIONES.educacion} value={v.education} onChange={set("education")} />
      <Choice name="occupation" label="Actualmente…" options={OPCIONES.ocupacion} value={v.occupation} onChange={set("occupation")} />
      <Choice name="estrato" label="Estrato socioeconómico de tu vivienda" options={OPCIONES.estrato} value={v.estrato} onChange={set("estrato")} inline />
      <Choice name="residence" label="¿Dónde vives?" options={OPCIONES.residencia} value={v.residence} onChange={set("residence")} />
      <Choice name="spanishFluent" label="¿El español es tu lengua materna o lo hablas con fluidez?" options={OPCIONES.siNo} value={v.spanishFluent} onChange={set("spanishFluent")} inline />
      <Choice name="psychStudent" label="¿Estudias o has estudiado psicología?" options={OPCIONES.siNo} value={v.psychStudent} onChange={set("psychStudent")} inline />
      <Choice name="deviceSelf" label="¿Desde qué dispositivo estás respondiendo?" options={OPCIONES.dispositivo} value={v.deviceSelf} onChange={set("deviceSelf")} inline />

      <div className="mt-2">
        <Button onClick={submit} disabled={busy}>
          {busy ? "Guardando…" : "Continuar"}
        </Button>
      </div>
      <ErrorText>{error}</ErrorText>
    </Shell>
  );
}
