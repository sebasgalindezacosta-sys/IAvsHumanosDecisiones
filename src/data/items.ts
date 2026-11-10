/**
 * BANCO DE SITUACIONES (10 ensayos + 1 de práctica)
 * ---------------------------------------------------------------------------
 * Cada situación tiene dos opciones (o1 y o2) equivalentes en costo, tiempo y
 * beneficio: solo difieren en gusto personal (equiplausibilidad).
 *
 * La RECOMENDACIÓN se arma así:  "Te recomiendo <recName>. <justificacion>"
 * La justificación es LA MISMA para las dos opciones (pasa la prueba de
 * intercambio por construcción) y la misma para IA y para persona.
 *
 * `numero` define el contrabalanceo: en el set A se recomienda o1 en los
 * ítems impares y o2 en los pares; en el set B, al revés. Ver lib/trialPlan.ts.
 *
 * Imágenes: public/estimulos/<id>_o1.jpg y <id>_o2.jpg (cuadradas, 720 px),
 * recortadas de docs/estimulos_originales/.
 */

export type OptionKey = "o1" | "o2";

export interface Option {
  label: string; // texto bajo la imagen
  recName: string; // cómo se nombra dentro de la recomendación
  img: string;
}

export interface Item {
  id: string;
  numero: number;
  dominio: string;
  situacion: string;
  justificacion: string;
  o1: Option;
  o2: Option;
}

const img = (id: string, k: OptionKey) => `/estimulos/${id}_${k}.jpg`;

export const ITEMS: Item[] = [
  {
    id: "gafas",
    numero: 1,
    dominio: "Accesorios",
    situacion:
      "Necesitas cambiar tus gafas. En la óptica te muestran dos monturas con el mismo precio, la misma fórmula y la misma garantía; solo cambia el diseño.",
    justificacion: "Para algo que vas a usar todos los días, suele funcionar bien elegir lo que te haga sentir a gusto.",
    o1: { label: "Montura negra de pasta", recName: "la montura negra de pasta", img: img("gafas", "o1") },
    o2: { label: "Montura metálica gris", recName: "la montura metálica gris", img: img("gafas", "o2") },
  },
  {
    id: "chocolate",
    numero: 2,
    dominio: "Alimentación",
    situacion:
      "Quieres darte un gusto después de una semana pesada. En la tienda hay dos chocolates de la misma marca, con el mismo tamaño, el mismo precio y el mismo porcentaje de cacao; solo cambian la forma y la presentación.",
    justificacion: "Para un gusto pequeño, suele valer la pena escoger el que más se te antoje en este momento.",
    o1: { label: "Chocolate clásico en barra", recName: "el chocolate clásico en barra", img: img("chocolate", "o1") },
    o2: { label: "Chocolate de diseño geométrico", recName: "el chocolate de diseño geométrico", img: img("chocolate", "o2") },
  },
  {
    id: "chaqueta",
    numero: 3,
    dominio: "Vestuario",
    situacion:
      "Vas a comprar una chaqueta para las noches frías. Encuentras dos de cuero, de tu talla y al mismo precio; solo cambia el estilo.",
    justificacion: "Para una prenda que vas a usar seguido, suele funcionar bien la que sientas más acorde contigo.",
    o1: { label: "Chaqueta café con forro de lana", recName: "la chaqueta café con forro de lana", img: img("chaqueta", "o1") },
    o2: { label: "Chaqueta negra estilo motociclista", recName: "la chaqueta negra estilo motociclista", img: img("chaqueta", "o2") },
  },
  {
    id: "reloj",
    numero: 4,
    dominio: "Accesorios",
    situacion:
      "Te van a regalar un reloj de cumpleaños y puedes escoger el color. Es el mismo modelo, con las mismas funciones y el mismo precio.",
    justificacion: "Para un regalo que vas a llevar contigo, suele ser buena idea escoger el que más te guste a primera vista.",
    o1: { label: "Reloj plateado", recName: "el reloj plateado", img: img("reloj", "o1") },
    o2: { label: "Reloj negro", recName: "el reloj negro", img: img("reloj", "o2") },
  },
  {
    id: "sillon",
    numero: 5,
    dominio: "Hogar",
    situacion:
      "Estás arreglando tu cuarto y quieres un sillón para leer. Hay dos que cuestan lo mismo, caben en el espacio y, según quienes los han probado, son igual de cómodos.",
    justificacion: "Para un espacio que es tuyo, suele funcionar bien elegir el mueble con el que más te identifiques.",
    o1: { label: "Sillón clásico con lana", recName: "el sillón clásico con lana", img: img("sillon", "o1") },
    o2: { label: "Sillón moderno con marco metálico", recName: "el sillón moderno con marco metálico", img: img("sillon", "o2") },
  },
  {
    id: "plan",
    numero: 6,
    dominio: "Ocio",
    situacion:
      "Este sábado tienes la tarde libre y quieres salir a despejarte un rato. Hay dos lugares gratuitos, a la misma distancia de tu casa.",
    justificacion: "Para una tarde libre, lo importante es que el plan te despeje, y esta suele ser una buena forma de lograrlo.",
    o1: { label: "Caminar por el parque principal", recName: "caminar por el parque principal", img: img("plan", "o1") },
    o2: { label: "Recorrer la ciclovía arborizada", recName: "recorrer la ciclovía arborizada", img: img("plan", "o2") },
  },
  {
    id: "tenis",
    numero: 7,
    dominio: "Vestuario",
    situacion:
      "Necesitas unos tenis para caminar y hacer ejercicio. Encuentras dos pares del mismo color, de tu talla y al mismo precio; los dos son igual de cómodos.",
    justificacion: "Para algo que vas a usar casi todos los días, suele convenir el par que más te guste al verlo.",
    o1: { label: "Tenis de suela angular", recName: "los tenis de suela angular", img: img("tenis", "o1") },
    o2: { label: "Tenis de suela ondulada", recName: "los tenis de suela ondulada", img: img("tenis", "o2") },
  },
  {
    id: "arepa",
    numero: 8,
    dominio: "Alimentación",
    situacion:
      "Es lunes por la mañana, tienes prisa y vas a desayunar algo rápido en una cafetería. Hay dos arepas que cuestan lo mismo y están listas al mismo tiempo.",
    justificacion: "Para un lunes con prisa, suele funcionar bien empezar el día con algo que te guste de verdad.",
    o1: { label: "Arepa con queso derretido", recName: "la arepa con queso derretido", img: img("arepa", "o1") },
    o2: { label: "Arepa con queso campesino", recName: "la arepa con queso campesino", img: img("arepa", "o2") },
  },
  {
    id: "cuaderno",
    numero: 9,
    dominio: "Estudio y trabajo",
    situacion:
      "Vas a la papelería a comprar un cuaderno para tus apuntes. Hay dos del mismo tamaño, con el mismo número de hojas y al mismo precio; solo cambia el color de la portada.",
    justificacion: "Para algo que vas a usar durante meses, suele convenir elegir el que más te represente.",
    o1: { label: "Cuaderno azul", recName: "el cuaderno azul", img: img("cuaderno", "o1") },
    o2: { label: "Cuaderno verde", recName: "el cuaderno verde", img: img("cuaderno", "o2") },
  },
  {
    id: "bicicleta",
    numero: 10,
    dominio: "Movilidad y ocio",
    situacion:
      "Quieres una bicicleta para salir a rodar los fines de semana. Hay dos de tu talla, del mismo color y al mismo precio.",
    justificacion: "Para algo que vas a usar en tu tiempo libre, suele funcionar bien escoger la que más ganas te dé de usar.",
    o1: { label: "Bicicleta de ruta", recName: "la bicicleta de ruta", img: img("bicicleta", "o1") },
    o2: { label: "Bicicleta de montaña", recName: "la bicicleta de montaña", img: img("bicicleta", "o2") },
  },
];

/** Ensayo de práctica: igual para todas las condiciones y SIN recomendación.
 *  Solo sirve para aprender a usar el control deslizante. */
export const PRACTICE: Item = {
  id: "practica",
  numero: 0,
  dominio: "Práctica",
  situacion: "Ensayo de práctica: ¿cuál de estas dos figuras te gusta más?",
  justificacion: "",
  o1: { label: "Círculo", recName: "el círculo", img: "/estimulos/practica_o1.svg" },
  o2: { label: "Cuadrado", recName: "el cuadrado", img: "/estimulos/practica_o2.svg" },
};

export function itemById(id: string): Item | undefined {
  if (id === PRACTICE.id) return PRACTICE;
  return ITEMS.find((i) => i.id === id);
}

export function recommendationText(item: Item, k: OptionKey): string {
  return `Te recomiendo ${item[k].recName}. ${item.justificacion}`;
}

export const ALL_IMAGES = [PRACTICE, ...ITEMS].flatMap((i) => [i.o1.img, i.o2.img]);
