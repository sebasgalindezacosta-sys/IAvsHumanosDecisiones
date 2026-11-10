import { q } from "@/lib/db";
import { isAdmin, toCsv } from "@/lib/admin";
import { ITEMS, itemById } from "@/data/items";

export const dynamic = "force-dynamic";

/**
 * Descarga de datos en CSV (ver docs/codebook.md).
 *   ?tipo=participantes → una fila por persona, con los promedios listos para el ANOVA
 *   ?tipo=ensayos       → una fila por situación respondida (formato largo)
 *   &prueba=1           → incluye también las sesiones de prueba (?test=1)
 */
const COLS_PARTICIPANTES = [
  "participante", "condicion", "genero_agente", "set_contrabalanceo", "es_prueba", "fuente_enlace", "paso_actual", "completo",
  "inicio", "fin", "duracion_s", "consentimiento", "elegible",
  "edad", "genero", "educacion", "ocupacion", "estrato", "residencia", "espanol_fluido", "estudia_psicologia",
  "dispositivo_declarado", "dispositivo_detectado", "puntero_tactil", "ancho_ventana", "alto_ventana",
  "chequeo_manipulacion", "manipulacion_ok", "tuvo_en_cuenta_rec", "confianza_fuente",
  "uso_ia_alguna_vez", "frecuencia_ia_mes", "frecuencia_ia_num", "formacion_ia", "estudios_previos_ia",
  "conocia_diseno", "objetivo_percibido",
  "n_ensayos", "pct_congruencia", "media_hacia_meta", "media_fuerza", "media_rt_ms", "mediana_rt_ms",
  "media_log_rt", "media_primer_mov_ms", "cambios_opcion", "ms_fuera", "ensayos_con_salida", "media_tam_imagen_px",
  "incluir_basico", "excluir_criterios",
];

const COLS_ENSAYOS = [
  "participante", "es_prueba", "condicion", "genero_agente", "set_contrabalanceo", "bloque", "posicion", "item", "dominio",
  "opcion_meta", "lado_meta", "opcion_izquierda", "opcion_derecha",
  "slider", "eleccion", "eleccion_texto", "lado_elegido", "congruente", "hacia_meta", "fuerza",
  "rt_ms", "log_rt", "primer_mov_ms", "inicio_a_confirmar_ms", "bloqueo_ms",
  "movimientos", "cambios_opcion", "max_hacia_meta", "min_hacia_meta",
  "puntero", "ms_fuera", "error_imagen", "tam_imagen_px", "ancho_ventana", "alto_ventana", "guardado", "trayectoria",
];

export async function GET(req: Request) {
  if (!isAdmin(req)) return new Response("contraseña incorrecta", { status: 401 });
  const url = new URL(req.url);
  const tipo = url.searchParams.get("tipo") === "ensayos" ? "ensayos" : "participantes";
  const conPrueba = url.searchParams.get("prueba") === "1";

  let csv: string;
  if (tipo === "participantes") {
    const rows = await q(
      `SELECT
         p.code AS participante, p.condition AS condicion, p.human_gender AS genero_agente, p.cb_set AS set_contrabalanceo,
         p.is_test::int AS es_prueba, p.source AS fuente_enlace, p.current_step AS paso_actual,
         (p.current_step = 'done')::int AS completo,
         p.created_at AS inicio, p.finished_at AS fin,
         round(extract(epoch FROM (p.finished_at - p.created_at))::numeric, 1) AS duracion_s,
         p.consent::int AS consentimiento, p.eligible::int AS elegible,
         p.age AS edad, p.gender AS genero, p.education AS educacion, p.occupation AS ocupacion,
         p.estrato, p.residence AS residencia, p.spanish_fluent AS espanol_fluido,
         p.psych_student AS estudia_psicologia, p.device_self AS dispositivo_declarado,
         p.device->>'deviceDetected' AS dispositivo_detectado,
         CASE p.device->>'pointerCoarse' WHEN 'true' THEN 1 WHEN 'false' THEN 0 END AS puntero_tactil,
         p.device->>'viewportW' AS ancho_ventana, p.device->>'viewportH' AS alto_ventana,
         p.manip_check AS chequeo_manipulacion,
         CASE WHEN p.manip_check IS NULL THEN NULL
              WHEN (p.condition = 'ia' AND p.manip_check = 'Una inteligencia artificial')
                OR (p.condition = 'humano' AND p.manip_check = 'Una persona')
                OR (p.condition = 'control' AND p.manip_check = 'No recibí recomendaciones') THEN 1 ELSE 0 END AS manipulacion_ok,
         p.rec_considered AS tuvo_en_cuenta_rec, p.rec_trust AS confianza_fuente,
         p.ai_ever AS uso_ia_alguna_vez, p.ai_freq AS frecuencia_ia_mes,
         CASE p.ai_freq WHEN 'Nunca' THEN 0 WHEN 'A veces' THEN 1 WHEN 'A menudo' THEN 2 WHEN 'A diario' THEN 3 END AS frecuencia_ia_num,
         p.ai_training AS formacion_ia, p.prior_studies AS estudios_previos_ia,
         p.knew_design AS conocia_diseno, p.guess_purpose AS objetivo_percibido,
         t.n_ensayos, t.pct_congruencia, t.media_hacia_meta, t.media_fuerza, t.media_rt_ms, t.mediana_rt_ms,
         t.media_log_rt, t.media_primer_mov_ms, t.cambios_opcion, t.ms_fuera, t.ensayos_con_salida, t.media_tam_imagen_px,
         CASE WHEN p.current_step = 'done' AND p.eligible AND t.n_ensayos = $2 AND NOT p.is_test THEN 1 ELSE 0 END AS incluir_basico,
         CASE WHEN p.ai_ever = 'No' OR p.ai_training = 'Sí' OR p.prior_studies = 'Sí' OR p.knew_design = 'Sí' THEN 1 ELSE 0 END AS excluir_criterios
       FROM participants p
       LEFT JOIN (
         SELECT participant_id,
                count(*)::int AS n_ensayos,
                round(100.0 * avg(congruent), 1) AS pct_congruencia,
                round(avg(toward_target), 2) AS media_hacia_meta,
                round(avg(strength), 2) AS media_fuerza,
                round(avg(rt_ms)) AS media_rt_ms,
                round((percentile_cont(0.5) WITHIN GROUP (ORDER BY rt_ms))::numeric) AS mediana_rt_ms,
                round(avg(ln(greatest(rt_ms, 1)))::numeric, 4) AS media_log_rt,
                round(avg(first_move_ms)) AS media_primer_mov_ms,
                sum(switches)::int AS cambios_opcion,
                sum(away_ms)::int AS ms_fuera,
                (count(*) FILTER (WHERE away_ms > 0))::int AS ensayos_con_salida,
                round(avg(img_px)) AS media_tam_imagen_px
           FROM trials WHERE block = 'main' GROUP BY participant_id
       ) t ON t.participant_id = p.id
      WHERE ($1::boolean OR NOT p.is_test)
      ORDER BY p.created_at`,
      [conPrueba, ITEMS.length],
    );
    csv = toCsv(rows, COLS_PARTICIPANTES);
  } else {
    const rows = await q(
      `SELECT p.code AS participante, p.is_test::int AS es_prueba, t.condition AS condicion, p.human_gender AS genero_agente,
              t.cb_set AS set_contrabalanceo, t.block AS bloque, t.trial_index AS posicion, t.item_id AS item,
              t.target_option AS opcion_meta, t.target_side AS lado_meta,
              t.left_option AS opcion_izquierda, t.right_option AS opcion_derecha,
              t.slider_value AS slider, t.choice_option AS eleccion, t.choice_side AS lado_elegido,
              t.congruent AS congruente, t.toward_target AS hacia_meta, t.strength AS fuerza,
              t.rt_ms, round(ln(greatest(t.rt_ms, 1))::numeric, 4) AS log_rt,
              t.first_move_ms AS primer_mov_ms, t.onset_to_confirm_ms AS inicio_a_confirmar_ms,
              t.lock_ms AS bloqueo_ms, t.moves AS movimientos, t.switches AS cambios_opcion,
              t.max_toward_target AS max_hacia_meta, t.min_toward_target AS min_hacia_meta,
              t.pointer_type AS puntero, t.away_ms AS ms_fuera, t.img_error::int AS error_imagen, t.img_px AS tam_imagen_px,
              t.viewport_w AS ancho_ventana, t.viewport_h AS alto_ventana, t.created_at AS guardado,
              t.trajectory AS trayectoria
         FROM trials t JOIN participants p ON p.id = t.participant_id
        WHERE ($1::boolean OR NOT p.is_test)
        ORDER BY p.created_at, t.block DESC, t.trial_index`,
      [conPrueba],
    );
    for (const r of rows) {
      const it = itemById(r.item);
      r.dominio = it?.dominio ?? null;
      r.eleccion_texto = it && (r.eleccion === "o1" || r.eleccion === "o2") ? it[r.eleccion as "o1" | "o2"].label : null;
    }
    csv = toCsv(rows, COLS_ENSAYOS);
  }

  const fecha = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${tipo}_${fecha}${conPrueba ? "_con_prueba" : ""}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
