import { ESTUDIO } from "@/data/estudio";

export function Shell({
  children,
  progress,
  step,
  compact = false,
}: {
  children: React.ReactNode;
  /** 0..1 — omitir para no mostrar barra */
  progress?: number;
  step?: React.ReactNode;
  /** menos margen vertical (pantallas de ensayo en celular) */
  compact?: boolean;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-line bg-card">
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-5 py-2.5 sm:py-3 flex items-baseline justify-between gap-3">
          <span className="truncate text-[12px] sm:text-[13px] tracking-[0.1em] sm:tracking-[0.14em] uppercase text-brand font-semibold">
            {ESTUDIO.titulo}
          </span>
          {step && <span className="whitespace-nowrap text-[12px] text-muted tabular-nums">{step}</span>}
        </div>
        {progress !== undefined && (
          <div
            className="h-[3px] w-full bg-brandSoft"
            role="progressbar"
            aria-valuenow={Math.round(progress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full bg-brand transition-[width] duration-300"
              style={{ width: `${Math.max(2, Math.min(100, progress * 100))}%` }}
            />
          </div>
        )}
      </header>

      <main className={`flex-1 mx-auto w-full max-w-3xl px-4 sm:px-5 ${compact ? "pt-3 pb-4 sm:py-6" : "py-8 sm:py-12"}`}>
        {children}
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-5 py-4 text-[12px] leading-relaxed text-muted">
          {ESTUDIO.institucion} — Investigación académica. Sin fines comerciales.
        </div>
      </footer>
    </div>
  );
}

export function Title({ children }: { children: React.ReactNode }) {
  return <h1 className="font-display text-[27px] sm:text-[33px] leading-tight text-ink mb-4">{children}</h1>;
}

export function Lead({ children }: { children: React.ReactNode }) {
  return <p className="max-w-measure text-[16px] text-muted mb-8">{children}</p>;
}
