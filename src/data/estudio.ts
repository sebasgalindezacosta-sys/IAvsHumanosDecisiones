/**
 * CONFIGURACIÓN GENERAL DEL ESTUDIO
 * ---------------------------------------------------------------------------
 * Casi todo lo que querrías cambiar sin tocar la lógica está aquí.
 */

export const ESTUDIO = {
  titulo: "Decisiones cotidianas",
  tituloCompleto: "Decisiones cotidianas: la influencia de la fuente de recomendación en jóvenes adultos",
  institucion: "Universidad de Cundinamarca · Programa de Psicología, Facatativá",
  investigadoras: [
    "Juliana Martínez Ortiz",
    "María Alejandra Barbosa Torres",
    "Paola Andrea González Suárez",
    "Tatiana Valentina Pineda Torres",
  ],
  docentes: ["Johan Sebastián Galíndez Acosta", "Felipe Ramírez Cortázar"],
  contacto: "mariaabarbosa@ucundinamarca.edu.co",
  edadMin: 18,
  edadMax: 35,
  duracionMin: "8 a 10 minutos",
};

export type Condition = "control" | "humano" | "ia";
export const CONDITIONS: Condition[] = ["control", "humano", "ia"];

/**
 * LOS DOS AGENTES RECOMENDADORES
 * Lo ÚNICO que cambia entre las condiciones "ia" y "humano" es este bloque:
 * el texto de la recomendación, su posición, su tamaño y el marcador son
 * idénticos.
 *
 * IMÁGENES (public/agentes/): ia.jpg, humano_hombre.jpg, humano_mujer.jpg.
 * Cuadradas (512×512 o más), mismo encuadre, fondo y luz (prompts en
 * docs/prompts_agentes.md). Se muestran recortadas en círculo. Para cambiarlas
 * basta con reemplazar los archivos manteniendo los nombres.
 * En la condición "humano", a cada participante se le asigna AL AZAR (y
 * balanceado 50/50) una sola persona —hombre o mujer— que le recomienda en
 * las 10 situaciones (participants.human_gender). El texto siempre dice
 * "una persona".
 *
 * Fuente humana: por defecto "una persona" (no "un amigo"). "Un amigo" mezcla
 * dos cosas (ser humano + cercanía afectiva) y entonces una diferencia IA vs.
 * amigo no se podría atribuir solo a que la fuente sea humana. Si el equipo
 * prefiere mantener "amigo" como en la Entrega 2, cambia `nombre` y `etiqueta`.
 */
export type HumanGender = "hombre" | "mujer";

export const AGENTES = {
  ia: {
    nombre: "una inteligencia artificial",
    etiqueta: "Inteligencia artificial",
  },
  humano: {
    nombre: "una persona",
    etiqueta: "Una persona",
  },
} as const;

export const AVATARES = {
  ia: "/agentes/ia.jpg",
  hombre: "/agentes/humano_hombre.jpg",
  mujer: "/agentes/humano_mujer.jpg",
} as const;

export type AgentKey = keyof typeof AGENTES;

/** Imagen del recomendador que ve un participante. */
export function avatarFor(agent: AgentKey, gender: HumanGender | null): string {
  if (agent === "ia") return AVATARES.ia;
  return gender === "mujer" ? AVATARES.mujer : AVATARES.hombre;
}

/** Tiempo (ms) que el control deslizante permanece bloqueado al inicio de cada
 *  situación, IGUAL en las tres condiciones. Garantiza que todos vean la
 *  situación (y la recomendación, si la hay) antes de poder responder. */
export const LOCK_MS = 2500;

/** Marcar con una etiqueta "Recomendada" la imagen recomendada (IA y humano). */
export const MARCAR_IMAGEN_RECOMENDADA = true;

/** Minutos sin actividad tras los cuales una sesión sin terminar deja de contar
 *  para el balanceo de grupos (su cupo se vuelve a asignar). */
export const MINUTOS_SESION_ACTIVA = 45;
