import { guard } from "@/lib/session";
import { Shell, Title } from "@/components/Shell";
import { debriefing } from "@/data/textos";
import { ESTUDIO } from "@/data/estudio";

export const dynamic = "force-dynamic";

/** Debriefing: se revela la manipulación y el carácter asignado de las recomendaciones. */
export default async function Page() {
  const p = await guard("done");
  return (
    <Shell progress={1} step="Fin">
      <Title>¡Gracias por participar!</Title>
      <div className="max-w-measure space-y-4 text-[16px] text-ink/90">
        {debriefing(p.condition).map((t) => (
          <p key={t}>{t}</p>
        ))}
      </div>
      <div className="mt-8 max-w-measure rounded-lg border border-line bg-card p-4 text-[15px]">
        <p>
          Tu código de participación es <strong className="font-mono text-[16px] tracking-wider">{p.code}</strong>.
        </p>
        <p className="mt-1 text-muted">
          Si tienes preguntas o quieres retirar tus datos, escribe a{" "}
          <a className="text-brand underline" href={`mailto:${ESTUDIO.contacto}`}>
            {ESTUDIO.contacto}
          </a>{" "}
          indicando este código.
        </p>
      </div>
      <p className="mt-8 text-[14px] text-muted">Ya puedes cerrar esta página.</p>
    </Shell>
  );
}
