import { ESTUDIO, AGENTES, type Condition } from "./estudio";

/* ===========================================================================
   CONSENTIMIENTO (adaptado del Anexo B de la Entrega 2)
   Cambio deliberado: ya NO menciona la inteligencia artificial. Nombrar la IA
   antes de la tarea le avisa a TODOS los grupos (también al de "persona" y al
   control) de qué trata el estudio. El criterio "haber usado IA al menos una
   vez" se pregunta al FINAL y se aplica al depurar los datos.
   =========================================================================== */
export const CONSENT_SECTIONS: { titulo: string; texto: string }[] = [
  {
    titulo: "Proyecto",
    texto: ESTUDIO.tituloCompleto + ".",
  },
  {
    titulo: "Investigadoras",
    texto: `${ESTUDIO.investigadoras.join(", ")}. ${ESTUDIO.institucion}. Docentes: ${ESTUDIO.docentes.join(" y ")}.`,
  },
  {
    titulo: "Propósito",
    texto: `Se le invita a participar en un estudio sobre cómo las personas toman decisiones cotidianas. Puede participar si tiene entre ${ESTUDIO.edadMin} y ${ESTUDIO.edadMax} años y habla español con fluidez.`,
  },
  {
    titulo: "Procedimiento",
    texto: `Responderá, en una sola sesión y en línea, diez situaciones cotidianas de bajo riesgo. En cada una elegirá entre dos opciones moviendo un control deslizante. Antes se le pedirán algunos datos generales (sin nombre ni documento) y al final unas preguntas breves sobre usted y sus hábitos. Al terminar recibirá una explicación completa del estudio. No hay límite de tiempo por pregunta; la duración estimada es de ${ESTUDIO.duracionMin}.`,
  },
  {
    titulo: "Información sobre el estudio",
    texto:
      "Para no influir en las respuestas, algunos detalles del diseño se explicarán al finalizar su participación. Tendrá la oportunidad de resolver todas sus dudas en ese momento.",
  },
  {
    titulo: "Riesgos y beneficios",
    texto:
      "Las decisiones son de bajo riesgo y no se prevén daños físicos ni psicológicos. No recibirá compensación económica; su participación contribuye a la comprensión de la toma de decisiones.",
  },
  {
    titulo: "Voluntariedad",
    texto:
      "Su participación es voluntaria. Puede retirarse en cualquier momento, sin ninguna consecuencia, simplemente cerrando la página. Si después de terminar desea retirar sus datos, puede escribir al correo de contacto con el código que verá al final.",
  },
  {
    titulo: "Confidencialidad",
    texto:
      "Sus respuestas son anónimas: no se le pedirá nombre, documento ni correo. Además de sus elecciones, se registrarán los tiempos de respuesta y el tipo de dispositivo (computador o celular), sin datos que lo identifiquen. La información se usará solo con fines académicos y se analizará de forma agregada, conforme a la Ley 1581 de 2012 sobre protección de datos personales.",
  },
  {
    titulo: "Marco normativo",
    texto:
      "Este estudio se ajusta a la Ley 1090 de 2006 (ejercicio profesional del psicólogo y código deontológico y bioético en Colombia) y a la Resolución 8430 de 1993 del Ministerio de Salud (normas científicas, técnicas y administrativas para la investigación en salud).",
  },
  {
    titulo: "Contacto",
    texto: `Para dudas sobre el estudio puede escribir a ${ESTUDIO.contacto}.`,
  },
];

export const CONSENT_DECLARATION =
  "He leído y comprendido la información anterior, he tenido la oportunidad de hacer preguntas y acepto participar voluntariamente en este estudio.";

/* ===========================================================================
   INSTRUCCIONES — mismo texto para todos, salvo la presentación del agente.
   =========================================================================== */
export const INSTRUCCIONES_COMUNES = [
  "Vas a ver 10 situaciones cotidianas. En cada una hay dos opciones, una a cada lado de la pantalla.",
  "Para elegir, arrastra el círculo del control hacia la opción que prefieres. Cuanto más lo acerques a una opción, más clara es tu preferencia. Luego pulsa «Confirmar».",
  "Al comienzo de cada situación el control se activa después de un par de segundos: aprovecha para leer.",
  "No hay respuestas correctas ni incorrectas. Responde como lo harías en tu vida diaria.",
];

export function presentacionAgente(condition: Condition): { titulo: string; texto: string } | null {
  if (condition === "control") return null;
  const a = AGENTES[condition];
  return {
    titulo: `En esta tarea recibirás recomendaciones de ${a.nombre}`,
    texto: `En cada situación verás la recomendación de ${a.nombre} que analizó las dos opciones. Puedes tenerla en cuenta o no: elige lo que realmente prefieras.`,
  };
}

/* ===========================================================================
   DEBRIEFING
   =========================================================================== */
export function debriefing(condition: Condition | null): string[] {
  const version =
    condition === "ia"
      ? "con recomendaciones atribuidas a una inteligencia artificial"
      : condition === "humano"
        ? "con recomendaciones atribuidas a una persona"
        : "sin recomendaciones";
  return [
    "Ahora sí te contamos el objetivo completo. Este estudio busca saber si la fuente de una recomendación —una inteligencia artificial, una persona o ninguna— cambia las decisiones que tomamos en situaciones cotidianas.",
    "A cada participante se le asignó al azar una de tres versiones: con recomendaciones atribuidas a una inteligencia artificial, con recomendaciones atribuidas a una persona, o sin recomendaciones.",
    `En tu caso viste la versión ${version}.`,
    "Las recomendaciones fueron escritas por el equipo de investigación y se asignaron al azar a una de las dos opciones: no provenían realmente de una inteligencia artificial ni de una persona en particular, y no indican cuál opción es mejor. Ninguna respuesta es correcta o incorrecta.",
    "Te pedimos no contar estos detalles a otras personas que puedan participar, hasta que termine la recolección de datos. ¡Así nos ayudas a que los resultados sean válidos!",
  ];
}

/* ===========================================================================
   OPCIONES DE RESPUESTA (sociodemográficos y cuestionario final)
   El valor guardado en la base es el texto tal cual.
   =========================================================================== */
export const OPCIONES = {
  genero: ["Mujer", "Hombre", "Otro", "Prefiero no responder"],
  educacion: [
    "Bachillerato",
    "Técnico o tecnológico",
    "Pregrado en curso",
    "Pregrado terminado",
    "Posgrado",
  ],
  ocupacion: ["Estudio", "Trabajo", "Estudio y trabajo", "Ninguna de las anteriores"],
  estrato: ["1", "2", "3", "4", "5", "6", "No sé"],
  residencia: ["Facatativá", "Otro municipio de Cundinamarca", "Bogotá", "Otro departamento de Colombia", "Fuera de Colombia"],
  siNo: ["Sí", "No"],
  dispositivo: ["Computador", "Celular", "Tableta"],
  manipCheck: ["Una inteligencia artificial", "Una persona", "No recibí recomendaciones", "No lo recuerdo"],
  frecuenciaIA: ["Nunca", "A veces", "A menudo", "A diario"],
  estudiosPrevios: ["Sí", "No", "No estoy seguro(a)"],
};
