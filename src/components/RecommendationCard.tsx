import { AGENTES, type AgentKey } from "@/data/estudio";

/**
 * Tarjeta de recomendación. Es EXACTAMENTE igual para IA y para persona:
 * mismo tamaño, posición, tipografía y texto; solo cambian la imagen y el
 * nombre de la fuente (data/estudio.ts → AGENTES y AVATARES).
 * En celular la imagen va junto al rótulo para que el texto use todo el ancho.
 */
export function RecommendationCard({ agent, avatar, text }: { agent: AgentKey; avatar: string; text: string }) {
  const a = AGENTES[agent];
  return (
    <div className="mt-2.5 sm:mt-3 rounded-lg border border-line bg-card px-3 py-2 sm:flex sm:items-start sm:gap-3 sm:px-4 sm:py-2.5">
      <Avatar src={avatar} className="hidden sm:block h-12 w-12" />
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-[11px] sm:text-[12px] uppercase tracking-[0.08em] sm:tracking-[0.12em] font-semibold leading-tight text-muted">
          <Avatar src={avatar} className="sm:hidden h-8 w-8" />
          <span>Recomendación de {a.nombre}</span>
        </p>
        <p className="mt-1 sm:mt-0.5 font-display text-[15px] sm:text-[16px] leading-snug text-ink">«{text}»</p>
      </div>
    </div>
  );
}

export function RecommendedBadge({ avatar }: { avatar: string }) {
  return (
    <span className="absolute left-1.5 top-1.5 sm:left-2 sm:top-2 inline-flex items-center gap-1 rounded-full bg-white/95 py-0.5 pl-0.5 pr-2 text-[11px] sm:text-[12px] font-semibold text-ink shadow">
      <Avatar src={avatar} className="h-5 w-5" />
      Recomendada
    </span>
  );
}

/** Imagen del agente recortada en círculo (las fotos se ven como foto de perfil). */
export function Avatar({ src, className = "" }: { src: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className={`shrink-0 rounded-full object-cover ring-1 ring-line bg-[#E6EAEE] ${className}`}
      draggable={false}
    />
  );
}
