/** Orden del protocolo y página de cada paso. */
export const STEP_PATH = {
  consent: "/consentimiento",
  demographics: "/datos",
  instructions: "/instrucciones",
  practice: "/practica",
  trials: "/experimento",
  post: "/cuestionario",
  done: "/fin",
  declined: "/salida",
  ineligible: "/salida",
} as const;

export type Step = keyof typeof STEP_PATH;

export const PROGRESS: Record<Step, number> = {
  consent: 0.04,
  demographics: 0.1,
  instructions: 0.18,
  practice: 0.22,
  trials: 0.25,
  post: 0.9,
  done: 1,
  declined: 1,
  ineligible: 1,
};

export function pathFor(step: string | null | undefined): string {
  return (step && (STEP_PATH as Record<string, string>)[step]) || "/";
}
