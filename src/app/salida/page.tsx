import { guard } from "@/lib/session";
import { Shell, Title } from "@/components/Shell";
import { ESTUDIO } from "@/data/estudio";

export const dynamic = "force-dynamic";

/** Para quien no aceptó el consentimiento o no cumple los criterios de inclusión. */
export default async function Page() {
  const p = await guard("declined", "ineligible");
  const declined = p.current_step === "declined";
  return (
    <Shell progress={1}>
      <Title>Gracias por tu tiempo</Title>
      <p className="max-w-measure text-[16px] text-ink/90">
        {declined
          ? "Respetamos tu decisión de no participar. No se registró ninguna respuesta tuya."
          : `Este estudio está dirigido a personas de ${ESTUDIO.edadMin} a ${ESTUDIO.edadMax} años que hablan español con fluidez, así que no es necesario que continúes. ¡Gracias por tu interés!`}
      </p>
      <p className="mt-6 text-[14px] text-muted">
        Si tienes preguntas, escribe a{" "}
        <a className="text-brand underline" href={`mailto:${ESTUDIO.contacto}`}>
          {ESTUDIO.contacto}
        </a>
        .
      </p>
    </Shell>
  );
}
