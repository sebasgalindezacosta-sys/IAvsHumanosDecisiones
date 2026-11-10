"use client";

import { useEffect, useState } from "react";
import { Shell, Title } from "@/components/Shell";
import { Button, ErrorText } from "@/components/ui";

type Grupo = { prueba: boolean; condicion: string; set: string; completos: number; en_curso: number; abandonados: number };
type Embudo = { prueba: boolean; paso: string; n: number };

const NOMBRE: Record<string, string> = { control: "Sin recomendación", humano: "Persona", ia: "IA" };
const PASO: Record<string, string> = {
  consent: "En el consentimiento",
  demographics: "En datos generales",
  instructions: "En instrucciones",
  practice: "En la práctica",
  trials: "En las situaciones",
  post: "En preguntas finales",
  done: "Terminaron",
  declined: "No aceptaron",
  ineligible: "No elegibles",
};

const KEY = "admin-token";

export function AdminClient() {
  const [token, setToken] = useState("");
  const [data, setData] = useState<{ grupos: Grupo[]; generos: { genero: string; completos: number }[]; embudo: Embudo[]; ahora: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [withTest, setWithTest] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const t = sessionStorage.getItem(KEY);
      if (t) setToken(t);
    } catch {
      /* almacenamiento no disponible */
    }
  }, []);

  async function load() {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/admin/summary", { headers: { "x-admin-token": token }, cache: "no-store" });
      if (r.status === 401) throw new Error("Contraseña incorrecta (revisa ADMIN_TOKEN en Vercel).");
      if (!r.ok) throw new Error("No se pudo leer la base de datos.");
      setData(await r.json());
      try {
        sessionStorage.setItem(KEY, token);
      } catch {
        /* sin almacenamiento */
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function download(tipo: "participantes" | "ensayos") {
    setError(null);
    const r = await fetch(`/api/admin/export?tipo=${tipo}${withTest ? "&prueba=1" : ""}`, {
      headers: { "x-admin-token": token },
      cache: "no-store",
    });
    if (!r.ok) {
      setError("No se pudo descargar el archivo.");
      return;
    }
    const blob = await r.blob();
    const name = r.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] ?? `${tipo}.csv`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const real = data?.grupos.filter((g) => !g.prueba) ?? [];
  const byCond = (c: string) => real.filter((g) => g.condicion === c);
  const sum = (gs: Grupo[], k: "completos" | "en_curso" | "abandonados") => gs.reduce((s, g) => s + g[k], 0);

  return (
    <Shell>
      <Title>Panel de investigadoras</Title>
      <div className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="block text-[14px] text-muted mb-1">Contraseña (ADMIN_TOKEN)</span>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            className="w-64 rounded-md border border-line bg-card px-3 py-2.5 text-[15px]"
          />
        </label>
        <Button onClick={load} disabled={busy || !token}>
          {busy ? "Cargando…" : data ? "Actualizar" : "Entrar"}
        </Button>
      </div>
      <ErrorText>{error}</ErrorText>

      {data && (
        <>
          <h2 className="mt-10 mb-3 font-display text-[21px]">Participantes por grupo (sin pruebas)</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-[15px] tabular-nums">
              <thead>
                <tr className="border-b border-line text-left text-[13px] uppercase tracking-wide text-muted">
                  <th className="py-2 pr-3">Grupo</th>
                  <th className="py-2 pr-3">Completos</th>
                  <th className="py-2 pr-3">Set A / B</th>
                  <th className="py-2 pr-3">En curso</th>
                  <th className="py-2">Abandonaron</th>
                </tr>
              </thead>
              <tbody>
                {["control", "humano", "ia"].map((c) => {
                  const gs = byCond(c);
                  const a = gs.find((g) => g.set === "A")?.completos ?? 0;
                  const b = gs.find((g) => g.set === "B")?.completos ?? 0;
                  return (
                    <tr key={c} className="border-b border-line">
                      <td className="py-2 pr-3">
                        {NOMBRE[c]}
                        {c === "humano" && (
                          <span className="block text-[12px] text-muted">
                            {data.generos.map((g) => `${g.genero === "mujer" ? "Mujer" : "Hombre"}: ${g.completos}`).join(" · ")}
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-3 font-semibold">{sum(gs, "completos")}</td>
                      <td className="py-2 pr-3 text-muted">
                        {a} / {b}
                      </td>
                      <td className="py-2 pr-3">{sum(gs, "en_curso")}</td>
                      <td className="py-2">{sum(gs, "abandonados")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <h2 className="mt-10 mb-3 font-display text-[21px]">Dónde está cada persona</h2>
          <ul className="grid gap-1 text-[15px] sm:grid-cols-2">
            {data.embudo
              .filter((e) => !e.prueba)
              .map((e) => (
                <li key={e.paso} className="flex justify-between border-b border-line py-1.5">
                  <span>{PASO[e.paso] ?? e.paso}</span>
                  <span className="tabular-nums font-semibold">{e.n}</span>
                </li>
              ))}
          </ul>
          <p className="mt-3 text-[13px] text-muted">
            Sesiones de prueba (?test=1): {data.embudo.filter((e) => e.prueba).reduce((s, e) => s + e.n, 0)} · Actualizado{" "}
            {new Date(data.ahora).toLocaleString("es-CO")}
          </p>

          <h2 className="mt-10 mb-3 font-display text-[21px]">Descargar datos (CSV)</h2>
          <label className="mb-4 flex items-center gap-2 text-[15px]">
            <input type="checkbox" checked={withTest} onChange={(e) => setWithTest(e.target.checked)} />
            Incluir sesiones de prueba
          </label>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => download("participantes")}>Participantes (1 fila por persona)</Button>
            <Button variant="ghost" onClick={() => download("ensayos")}>
              Ensayos (1 fila por situación)
            </Button>
          </div>
          <p className="mt-3 max-w-measure text-[13px] text-muted">
            El archivo de participantes ya trae el % de congruencia, la posición media del control y el tiempo medio de
            decisión de cada persona: se puede abrir directamente en JASP, jamovi, SPSS o R para el ANOVA. Variables
            explicadas en docs/codebook.md del repositorio.
          </p>
        </>
      )}
    </Shell>
  );
}
