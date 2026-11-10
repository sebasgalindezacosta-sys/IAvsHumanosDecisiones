# Libro de códigos

Dos archivos CSV se descargan desde `/admin` (coma como separador, punto decimal, UTF-8).
Celdas vacías = dato no aplicable o no respondido.

## `participantes_AAAA-MM-DD.csv` — una fila por persona

### Identificación y flujo

| Variable | Descripción |
|---|---|
| `participante` | Código anónimo (`P-XXXXXX`; `T-…` = sesión de prueba). Es el que ve la persona al final para pedir que se borren sus datos. |
| `condicion` | `control` (sin recomendación), `humano` (una persona), `ia` (inteligencia artificial). **VI**. |
| `genero_agente` | Solo en `humano`: `hombre` o `mujer`, la imagen de la persona que le recomendó (asignada al azar y balanceada, la misma en las 10 situaciones). Vacío en `ia` y `control`. |
| `set_contrabalanceo` | `A`: se recomiendan o1 en ítems impares y o2 en pares · `B`: al revés. |
| `es_prueba` | 1 = entró con `?test=1`. |
| `fuente_enlace` | Valor de `?src=` del enlace (p. ej. `whatsapp`). |
| `paso_actual` | Último paso alcanzado: `consent`, `demographics`, `instructions`, `practice`, `trials`, `post`, `done`, `declined` (no aceptó), `ineligible`. |
| `completo` | 1 = llegó al debriefing. |
| `inicio`, `fin` | Fecha y hora UTC. |
| `duracion_s` | Segundos totales entre inicio y fin. |
| `consentimiento` | 1 acepta · 0 no acepta. |
| `elegible` | 1 = 18–35 años y español fluido. |

### Sociodemográficos (antes de la tarea, sin mencionar la IA)

`edad`, `genero`, `educacion`, `ocupacion`, `estrato` (1–6 o «No sé»), `residencia`, `espanol_fluido`, `estudia_psicologia`, `dispositivo_declarado` (Computador / Celular / Tableta).

### Dispositivo (detectado automáticamente)

| Variable | Descripción |
|---|---|
| `dispositivo_detectado` | `pc`, `movil`, `tableta`. |
| `puntero_tactil` | 1 = el puntero principal es táctil. |
| `ancho_ventana`, `alto_ventana` | Tamaño de la ventana (px) al empezar. |

### Preguntas finales

| Variable | Descripción |
|---|---|
| `chequeo_manipulacion` | «¿Quién te daba las recomendaciones?» (IA / Una persona / No recibí recomendaciones / No lo recuerdo). |
| `manipulacion_ok` | 1 = respuesta coincide con su condición. |
| `tuvo_en_cuenta_rec` | 1–7, solo IA y persona. |
| `confianza_fuente` | 1–7, solo IA y persona. |
| `uso_ia_alguna_vez` | Sí / No (criterio de inclusión: haber usado IA al menos una vez). |
| `frecuencia_ia_mes` / `frecuencia_ia_num` | Nunca 0 · A veces 1 · A menudo 2 · A diario 3. **Variable extraña / covariable.** |
| `formacion_ia` | Formación o trabajo en IA o ciencia de datos (criterio de exclusión). |
| `estudios_previos_ia` | Ha participado antes en estudios sobre IA (criterio de exclusión). |
| `conocia_diseno` | Conocía el objetivo o diseño (criterio de exclusión). |
| `objetivo_percibido` | Texto libre opcional: de qué cree que se trataba (sondeo de sospecha). |

### Puntajes por persona (calculados de sus 10 ensayos)

| Variable | Descripción |
|---|---|
| `n_ensayos` | Situaciones respondidas (debería ser 10). |
| `pct_congruencia` | **VD 1.** % de situaciones en que eligió la opción recomendada (control: la opción meta oculta). |
| `media_hacia_meta` | **VD 2.** Media de `hacia_meta` (−100 a 100). |
| `media_fuerza` | Media de |slider| (0–100): qué tan marcada fue la preferencia, sin importar hacia dónde. |
| `media_rt_ms`, `mediana_rt_ms` | **VD 3.** Tiempo de decisión (ms) sin depurar. |
| `media_log_rt` | Media del logaritmo natural del RT (más normal; mejor para el ANOVA). |
| `media_primer_mov_ms` | Media del tiempo hasta el primer movimiento del control. |
| `cambios_opcion` | Total de veces que el control cruzó el centro (dudas). |
| `ms_fuera`, `ensayos_con_salida` | Tiempo total y nº de ensayos con la pestaña oculta o la ventana sin foco. |
| `media_tam_imagen_px` | Lado medio (px) con que vio las imágenes. |
| `incluir_basico` | 1 = completo, elegible, 10 ensayos y no prueba. **Filtro mínimo.** |
| `excluir_criterios` | 1 = no ha usado IA nunca, o formación en IA, o estudios previos, o conocía el diseño. |

> Para el RT conviene depurar a nivel de ensayo (quitar `ms_fuera > 0` y RT > 60 s). El script `analisis/analisis_anova.py` lo hace solo.

## `ensayos_AAAA-MM-DD.csv` — una fila por situación respondida

| Variable | Descripción |
|---|---|
| `participante`, `es_prueba`, `condicion`, `genero_agente`, `set_contrabalanceo` | Como arriba. |
| `bloque` | `practice` (la figura de práctica, no se analiza) o `main`. |
| `posicion` | Orden en que la vio (1–10). |
| `item`, `dominio` | Situación (`gafas`, `chocolate`, `chaqueta`, `reloj`, `sillon`, `plan`, `tenis`, `arepa`, `cuaderno`, `bicicleta`) y su dominio. |
| `opcion_meta` | `o1`/`o2`: la recomendada (IA, persona) o la meta oculta (control). |
| `lado_meta` | `left`/`right`: dónde estaba la opción meta en pantalla. |
| `opcion_izquierda`, `opcion_derecha` | Qué opción quedó a cada lado. |
| `slider` | Posición final cruda: −100 (todo a la izquierda) … +100 (todo a la derecha). Nunca 0. |
| `eleccion`, `eleccion_texto`, `lado_elegido` | Opción elegida (signo del slider). |
| `congruente` | 1 = eligió la opción meta. |
| `hacia_meta` | `slider` recodificado: positivo = hacia la opción meta. |
| `fuerza` | |slider|. |
| `rt_ms`, `log_rt` | Tiempo de decisión: de la activación del control a «Confirmar». |
| `primer_mov_ms` | De la activación al primer movimiento. |
| `inicio_a_confirmar_ms` | Desde que aparece la situación (= `rt_ms` + `bloqueo_ms`). |
| `bloqueo_ms` | Tiempo con el control bloqueado al inicio (2500 ms en las tres condiciones). |
| `movimientos`, `cambios_opcion` | Nº de eventos de movimiento; nº de cruces por el centro. |
| `max_hacia_meta`, `min_hacia_meta` | Extremos alcanzados durante el arrastre (atracción hacia la otra opción). |
| `puntero` | `mouse`, `touch`, `pen` o `keyboard`. |
| `ms_fuera` | Tiempo con la pestaña oculta o sin foco durante el ensayo (si > 0, RT no limpio). |
| `error_imagen` | 1 = alguna imagen no cargó. |
| `tam_imagen_px` | Lado (px) con que se mostró cada imagen (en pantallas muy pequeñas se reducen para que todo quepa sin scroll). |
| `ancho_ventana`, `alto_ventana` | Tamaño de la ventana en ese ensayo. |
| `guardado` | Hora del servidor (UTC). |
| `trayectoria` | JSON `[[ms desde la activación, posición], …]` del arrastre. |
