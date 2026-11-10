"use client";

export function Button({
  children,
  disabled,
  onClick,
  variant = "primary",
  type = "button",
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  variant?: "primary" | "ghost";
  type?: "button" | "submit";
}) {
  const base =
    "inline-flex items-center justify-center px-6 py-3 text-[15px] font-medium rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed";
  const styles =
    variant === "primary"
      ? "bg-brand text-white hover:bg-ink"
      : "border border-line bg-card text-ink hover:border-brand hover:text-brand";
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${styles}`}>
      {children}
    </button>
  );
}

/** Pregunta con opciones tipo botón (una sola respuesta). */
export function Choice({
  name,
  label,
  help,
  options,
  value,
  onChange,
  inline = false,
}: {
  name: string;
  label: string;
  help?: string;
  options: readonly string[];
  value: string | null;
  onChange: (v: string) => void;
  inline?: boolean;
}) {
  return (
    <fieldset className="mb-7">
      <legend className="text-[16px] font-medium text-ink mb-1">{label}</legend>
      {help && <p className="text-[14px] text-muted mb-2">{help}</p>}
      <div className={`mt-2 ${inline ? "flex flex-wrap gap-2" : "grid gap-2 sm:grid-cols-2"}`}>
        {options.map((o) => {
          const checked = value === o;
          return (
            <label
              key={o}
              className={`flex items-center gap-3 cursor-pointer rounded-md border px-3 py-2.5 text-[15px] transition-colors ${
                checked ? "border-brand bg-brandSoft text-ink" : "border-line bg-card hover:border-muted"
              } ${inline ? "min-w-[3.25rem] justify-center" : ""}`}
            >
              <input
                type="radio"
                name={name}
                value={o}
                checked={checked}
                onChange={() => onChange(o)}
                className={inline ? "sr-only" : "accent-[rgb(var(--brand))] h-4 w-4"}
              />
              <span>{o}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Escala 1–7 con anclas en los extremos. */
export function Likert7({
  name,
  label,
  low,
  high,
  value,
  onChange,
}: {
  name: string;
  label: string;
  low: string;
  high: string;
  value: number | null;
  onChange: (v: number) => void;
}) {
  return (
    <fieldset className="mb-7">
      <legend className="text-[16px] font-medium text-ink mb-3">{label}</legend>
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {[1, 2, 3, 4, 5, 6, 7].map((n) => (
          <label
            key={n}
            className={`flex h-11 items-center justify-center rounded-md border cursor-pointer text-[15px] tabular-nums transition-colors ${
              value === n ? "border-brand bg-brand text-white" : "border-line bg-card hover:border-muted"
            }`}
          >
            <input type="radio" name={name} value={n} checked={value === n} onChange={() => onChange(n)} className="sr-only" />
            {n}
          </label>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[13px] text-muted">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </fieldset>
  );
}

export function ErrorText({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <p className="mt-4 text-[14px] text-[#9b1c1c]" role="alert">
      {children}
    </p>
  );
}
