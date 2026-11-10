"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { MARCAR_IMAGEN_RECOMENDADA, type AgentKey } from "@/data/estudio";
import { RecommendationCard, RecommendedBadge } from "./RecommendationCard";

export type Side = "left" | "right";

export interface TrialView {
  itemId: string;
  situacion: string;
  left: { label: string; img: string };
  right: { label: string; img: string };
  /** null en el grupo control y en la práctica */
  rec: null | { agent: AgentKey; avatar: string; text: string; side: Side };
}

export interface TrialResult {
  itemId: string;
  sliderValue: number;
  trajectory: [number, number][];
  rtMs: number;
  firstMoveMs: number | null;
  onsetToConfirmMs: number;
  lockMs: number;
  moves: number;
  pointerType: string | null;
  awayMs: number;
  imgError: boolean;
  viewportW: number;
  viewportH: number;
  /** lado (px CSS) con que se mostró cada imagen en este ensayo */
  imgPx: number;
}

type Phase = "loading" | "locked" | "active";

/** Tamaño mínimo (px) de cada imagen cuando hay que achicarlas para que todo quepa. */
const MIN_IMG_PX = 105;

/**
 * UNA SITUACIÓN con control deslizante bilateral (-100 … +100).
 *
 * Tiempos (todos con performance.now()):
 *  - onset: cuando las DOS imágenes ya cargaron y todo aparece a la vez.
 *  - bloqueo: el control queda inactivo `lockMs` en las tres condiciones.
 *  - rtMs: desde que el control se activa hasta «Confirmar».
 *  - firstMoveMs: desde que el control se activa hasta el primer movimiento.
 *  - awayMs: tiempo con la pestaña oculta o la ventana sin foco (RT no limpio).
 * La trayectoria guarda [ms desde la activación, posición] durante el arrastre.
 */
export function TrialScreen({
  trial,
  lockMs,
  busy,
  onCommit,
}: {
  trial: TrialView;
  lockMs: number;
  busy: boolean;
  onCommit: (r: TrialResult) => void;
}) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [value, setValue] = useState(0);
  const [touched, setTouched] = useState(false);
  const [wrapMax, setWrapMax] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const firstImgBox = useRef<HTMLDivElement>(null);

  /**
   * AJUSTE A LA PANTALLA: si «Confirmar» quedaría por debajo del borde, se
   * achican las imágenes lo justo para que todo quepa sin hacer scroll (hacer
   * scroll sumaría tiempo al RT solo en las condiciones con recomendación, que
   * ocupan más alto). Se mide ANTES de mostrar el ensayo (contenido invisible).
   * El tamaño final de las imágenes queda guardado en img_px.
   */
  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const btn = btnRef.current;
    if (!wrap || !btn) return;
    const overflow = btn.getBoundingClientRect().bottom + window.scrollY + 10 - window.innerHeight;
    if (overflow <= 0) return;
    const w = wrap.getBoundingClientRect().width;
    const gap = parseFloat(getComputedStyle(wrap.firstElementChild as Element).columnGap) || 12;
    const target = Math.max(2 * MIN_IMG_PX + gap, Math.floor(w - 2 * overflow));
    if (target < w - 1) setWrapMax(target);
  }, [wrapMax]);

  // Si cambia el ANCHO de la ventana (p. ej. girar el celular) se vuelve a medir.
  useEffect(() => {
    let lastW = window.innerWidth;
    const onResize = () => {
      if (window.innerWidth !== lastW) {
        lastW = window.innerWidth;
        setWrapMax(null);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const imgs = useRef<(HTMLImageElement | null)[]>([null, null]);
  const loaded = useRef<boolean[]>([false, false]);
  const imgError = useRef(false);
  const onsetAt = useRef(0);
  const unlockAt = useRef(0);
  const firstMove = useRef<number | null>(null);
  const moves = useRef(0);
  const traj = useRef<[number, number][]>([]);
  const pointerType = useRef<string | null>(null);
  const awayMs = useRef(0);
  const awaySince = useRef<number | null>(null);
  const started = useRef(false);

  function start() {
    if (started.current) return;
    started.current = true;
    onsetAt.current = performance.now();
    setPhase("locked");
    window.setTimeout(() => {
      unlockAt.current = performance.now();
      setPhase("active");
    }, lockMs);
  }

  function markLoaded(k: 0 | 1, ok: boolean) {
    if (!ok) imgError.current = true;
    loaded.current[k] = true;
    if (loaded.current[0] && loaded.current[1]) start();
  }

  // Imágenes que ya estaban en caché (pueden cargar antes de que React escuche onLoad)
  useEffect(() => {
    imgs.current.forEach((el, k) => {
      if (el && el.complete) markLoaded(k as 0 | 1, el.naturalWidth > 0);
    });
    // Red de seguridad: si una imagen no carga en 8 s, se sigue igual (se registra el error).
    const t = window.setTimeout(() => {
      if (!started.current) {
        imgError.current = true;
        start();
      }
    }, 8000);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const leave = () => {
      if (awaySince.current === null) awaySince.current = performance.now();
    };
    const back = () => {
      if (awaySince.current !== null && !document.hidden) {
        awayMs.current += performance.now() - awaySince.current;
        awaySince.current = null;
      }
    };
    const onVisibility = () => (document.hidden ? leave() : back());
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", leave);
    window.addEventListener("focus", back);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", leave);
      window.removeEventListener("focus", back);
    };
  }, []);

  function onSlide(v: number) {
    if (phase !== "active") return;
    const now = performance.now();
    const rel = Math.round(now - unlockAt.current);
    if (firstMove.current === null) firstMove.current = rel;
    moves.current += 1;
    const tr = traj.current;
    const last = tr[tr.length - 1];
    if (!last || rel - last[0] >= 20 || Math.sign(v) !== Math.sign(last[1])) {
      if (tr.length < 800) tr.push([rel, v]);
    } else {
      last[1] = v;
    }
    setValue(v);
    if (!touched) setTouched(true);
  }

  function confirm() {
    if (phase !== "active" || !touched || value === 0 || busy) return;
    const now = performance.now();
    const away = awayMs.current + (awaySince.current !== null ? now - awaySince.current : 0);
    onCommit({
      itemId: trial.itemId,
      sliderValue: value,
      trajectory: traj.current,
      rtMs: Math.round(now - unlockAt.current),
      firstMoveMs: firstMove.current,
      onsetToConfirmMs: Math.round(now - onsetAt.current),
      lockMs,
      moves: moves.current,
      pointerType: pointerType.current,
      awayMs: Math.round(away),
      imgError: imgError.current,
      viewportW: window.innerWidth,
      viewportH: window.innerHeight,
      imgPx: firstImgBox.current?.offsetWidth ?? 0, // offsetWidth ignora el leve zoom del halo
    });
  }

  const leftGlow = touched && value < 0 ? -value / 100 : 0;
  const rightGlow = touched && value > 0 ? value / 100 : 0;
  const fillLeft = value < 0 ? 50 + value / 2 : 50;
  const fillWidth = Math.abs(value) / 2;
  const leaning = value < 0 ? trial.left.label : value > 0 ? trial.right.label : null;

  let hint = "";
  if (phase === "locked") hint = "Lee la situación. El control se activará en un momento.";
  else if (phase === "active" && !touched) hint = "Arrastra el círculo hacia la opción que prefieres.";
  else if (phase === "active" && value === 0) hint = "Estás justo en el centro: mueve el círculo hacia una de las dos opciones.";
  else if (phase === "active" && leaning) hint = `Te inclinas por: ${leaning}`;

  return (
    <div className="relative">
      {phase === "loading" && <p className="absolute inset-x-0 top-16 text-center text-[14px] text-muted">Cargando…</p>}

      <div className={phase === "loading" ? "invisible" : "fade-in"}>
        <p className="font-display text-[16.5px] sm:text-[20px] leading-snug text-ink max-w-measure">{trial.situacion}</p>

        {trial.rec && <RecommendationCard agent={trial.rec.agent} avatar={trial.rec.avatar} text={trial.rec.text} />}

        {/* Imágenes y control comparten ancho, limitado por la ALTURA de la pantalla
            y, si hace falta, ajustado por el useLayoutEffect de arriba. */}
        <div
          ref={wrapRef}
          className="mx-auto"
          style={{ maxWidth: `min(100%, calc(56vh + 1.5rem)${wrapMax !== null ? `, ${wrapMax}px` : ""})` }}
        >
        <div className="mt-2.5 sm:mt-3 grid grid-cols-2 gap-3 sm:gap-6">
          {(["left", "right"] as const).map((side, k) => {
            const opt = trial[side];
            const glow = side === "left" ? leftGlow : rightGlow;
            const recommended = MARCAR_IMAGEN_RECOMENDADA && trial.rec?.side === side;
            return (
              <div key={side} className="flex flex-col items-center">
                <div
                  ref={k === 0 ? firstImgBox : undefined}
                  className="relative w-full overflow-hidden rounded-lg border transition-[box-shadow,border-color,transform] duration-100"
                  style={{
                    borderColor: `rgb(var(--brand) / ${0.2 + glow * 0.8})`,
                    boxShadow:
                      glow > 0.02
                        ? `0 0 0 ${1 + glow * 3}px rgb(var(--brand) / ${glow * 0.55}), 0 8px 26px rgb(var(--brand) / ${glow * 0.3})`
                        : "0 1px 3px rgb(0 0 0 / 0.12)",
                    transform: `scale(${1 + glow * 0.03})`,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={(el) => {
                      imgs.current[k] = el;
                    }}
                    src={opt.img}
                    alt={opt.label}
                    className="block aspect-square w-full select-none object-cover"
                    draggable={false}
                    onLoad={() => markLoaded(k as 0 | 1, true)}
                    onError={() => markLoaded(k as 0 | 1, false)}
                  />
                  {recommended && trial.rec && <RecommendedBadge avatar={trial.rec.avatar} />}
                </div>
                <p className="mt-1 sm:mt-1.5 text-center text-[13px] sm:text-[15px] font-medium leading-tight sm:leading-snug text-ink">{opt.label}</p>
              </div>
            );
          })}
        </div>

        <div className="relative mt-1.5 sm:mt-2.5">
          <div className="pointer-events-none absolute left-0 right-0 top-1/2 -translate-y-1/2 px-[16px]">
            <div className="relative h-[3px] w-full rounded bg-line">
              <div
                className="absolute top-0 h-[3px] rounded bg-brand"
                style={{ left: `${fillLeft}%`, width: `${fillWidth}%` }}
              />
              <div className="absolute left-1/2 top-1/2 h-4 w-[2px] -translate-x-1/2 -translate-y-1/2 bg-muted/60" />
            </div>
          </div>
          <input
            type="range"
            className="beam relative"
            min={-100}
            max={100}
            step={1}
            value={value}
            disabled={phase !== "active" || busy}
            data-untouched={!touched}
            aria-label="Control para elegir entre la opción de la izquierda y la de la derecha"
            aria-valuetext={!touched ? "sin respuesta" : value === 0 ? "en el centro" : `${leaning}`}
            onPointerDown={(e) => {
              if (!pointerType.current) pointerType.current = e.pointerType || null;
            }}
            onKeyDown={() => {
              if (!pointerType.current) pointerType.current = "keyboard";
            }}
            onChange={(e) => onSlide(Number(e.target.value))}
          />
        </div>

        <div className="min-h-[2.1rem] sm:min-h-[2.4rem]">
          {phase === "locked" && (
            <div className="mx-auto mb-1 h-[3px] w-32 overflow-hidden rounded bg-line">
              <div className="lockbar h-full bg-muted" style={{ animationDuration: `${lockMs}ms` }} />
            </div>
          )}
          <p className="text-center text-[13px] sm:text-[13.5px] leading-snug text-muted" aria-live="polite">
            {hint}
          </p>
        </div>
        </div>

        <div className="mt-1 sm:mt-2 flex justify-center">
          <button
            ref={btnRef}
            type="button"
            onClick={confirm}
            disabled={phase !== "active" || !touched || value === 0 || busy}
            className="inline-flex min-w-[11rem] items-center justify-center rounded-md bg-brand px-8 py-2.5 sm:py-3 text-[15px] font-medium text-white transition-colors hover:bg-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? "Guardando…" : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
