# Diseño del experimento y decisiones metodológicas

## 1. ¿Entre sujetos o intra sujetos?

**Entre sujetos (cada persona ve una sola condición).** Es la mejor opción aquí, por tres razones:

1. **Ocultar la hipótesis.** Si una misma persona viera recomendaciones de "una IA" y de "una persona", notaría de inmediato que se compara la fuente y respondería en función de eso (características de demanda). Viendo una sola fuente, la manipulación pasa desapercibida.
2. **Pocos ensayos.** Con 10 situaciones, repartirlas entre 3 condiciones dejaría ~3 por condición y por persona: medidas muy poco fiables.
3. **Sin arrastre.** Ver primero a la IA cambiaría cómo se lee después a la persona (y al revés).

El costo es potencia: con 90 personas (30 por grupo) el ANOVA detecta con 0,80 de potencia efectos de f ≈ 0,36 (grandes). El control deslizante ayuda porque `media_hacia_meta` es continua y más sensible que el % de congruencia. Si sobra tiempo de recolección, cada 15 personas extra por grupo suben bastante la potencia.

Lo que sí varía **dentro** de cada persona, para que no contamine la comparación: el orden de las situaciones, el lado en pantalla y cuál de las dos opciones se recomienda.

## 2. Contrabalanceo

| Factor | Cómo | Por qué |
|---|---|---|
| Orden de las 10 situaciones | Aleatorio por persona (semilla guardada) | Evita efectos de orden y fatiga ligados a un ítem. |
| Opción recomendada | Set A: o1 en ítems impares, o2 en pares · Set B: al revés. Balanceado dentro de cada grupo. | Cada opción de cada ítem se recomienda igual número de veces: si una opción es más atractiva por sí misma, ese atractivo se reparte igual entre "seguir" y "no seguir" la recomendación. |
| Lado de la opción recomendada | 5 izquierda / 5 derecha por persona, en orden aleatorio | Evita que el lado en pantalla (p. ej. preferir la derecha) se confunda con seguir la recomendación. |
| Grupo control | Recibe exactamente el mismo plan, pero la opción meta **no se muestra** | Da la línea base: si la recomendación no influyera, la congruencia sería ≈ 50 %. |

Esto reemplaza la secuencia fija de la Entrega 2 (A, B, A, A, B, B, A, B, A, B), que era igual para todos: con secuencia fija, cualquier preferencia por una opción concreta queda confundida con "seguir la recomendación".

## 3. Cómo se presenta a los agentes

- **Imágenes de los agentes generadas con prompts emparejados** (`docs/prompts_agentes.md`): un hombre, una mujer y una IA (robot) con el mismo encuadre, fondo, luz, ropa, expresión y edad aparente. Se muestran recortadas en círculo.
- **Persona: hombre o mujer al azar.** En la condición "humano" cada participante ve **una sola** persona (hombre o mujer) en las 10 situaciones, asignada al azar y balanceada 50/50 dentro de cada set (`genero_agente`). Una sola persona por participante mantiene el paralelo con la IA (un solo agente). Alternar hombre y mujer entre ensayos daría dos recomendadores distintos frente a una sola IA. Con `genero_agente` se puede comprobar que ninguna de las dos imágenes arrastra el efecto (el script lo reporta como análisis exploratorio).
- Imágenes finales: `public/agentes/` (512×512). Las personas se recortaron un poco más cerca para que su cabeza ocupe la misma proporción del cuadro que la del robot, con los ojos a la misma altura; fondo y luminancia ya venían prácticamente iguales (≈ 164–166). Originales en `docs/agentes_originales/`.
- **Presentación al inicio**, en las instrucciones: "En esta tarea recibirás recomendaciones de [una inteligencia artificial / una persona] que analizó las dos opciones". Misma frase, misma competencia atribuida.
- **En cada situación**: tarjeta con avatar + "Recomendación de [una inteligencia artificial / una persona]" + la frase, y una etiqueta «Recomendada» sobre la imagen. Todo idéntico salvo avatar y nombre.
- **"Una persona" en vez de "un amigo".** "Amigo" mezcla dos cosas (ser humano + cercanía afectiva); con "amigo", una diferencia frente a la IA podría deberse a la cercanía y no a que la fuente sea humana. Si el equipo quiere conservar "amigo" (como en la Entrega 2), se cambia en `src/data/estudio.ts`, pero conviene justificarlo en el informe.
- **Texto de la recomendación**: "Te recomiendo <opción>. <justificación>". La justificación es la misma para las dos opciones del ítem (pasa la prueba de intercambio por construcción) y se redactó en el mismo estilo general que la Entrega 2 ("suele funcionar bien…"). Se nombra la opción por su contenido y no como "opción A", porque el lado en pantalla cambia.

## 4. Tiempos y pantalla

- El control queda **bloqueado 2,5 s** al inicio de cada situación en las tres condiciones: todas las personas alcanzan a ver la situación (y la recomendación) antes de responder. `rt_ms` se mide desde que se activa.
- Las imágenes se precargan en las instrucciones; cada situación aparece **completa a la vez** cuando sus dos imágenes ya cargaron.
- **Todo cabe sin hacer scroll** (probado en portátil 1366×657, 1280×720, 1920×960, iPhone 13 y Galaxy S9+). Si hiciera falta, las imágenes se achican un poco. Sin esto, los grupos con recomendación (que ocupan más alto) tendrían que hacer scroll y su RT saldría inflado artificialmente. El tamaño mostrado queda guardado (`tam_imagen_px`).
- **Nota para el análisis del RT:** IA vs. persona es una comparación limpia (misma pantalla, mismo texto). Control vs. recomendación incluye, además, el tiempo de leer la recomendación.

## 5. Cambios respecto a la Entrega 2 (para reportar)

1. El consentimiento ya **no menciona la IA**. Nombrarla antes de la tarea avisa a todos los grupos de qué trata el estudio. El criterio "haber usado IA al menos una vez" se pregunta al final (`uso_ia_alguna_vez`) y se aplica al depurar. Hay que actualizar el Anexo B con el texto de `src/data/textos.ts`.
2. Se elimina "Nombre (opcional)" del consentimiento: el estudio es anónimo.
3. Respuesta con control deslizante (decisión + posición + tiempo) en vez de elección A/B.
4. Secuencia fija → contrabalanceo (sección 2).
5. "Amigo" → "una persona" (sección 3).
6. Se añade un **chequeo de manipulación** y la pregunta abierta sobre el objetivo percibido.
7. En la red nomológica de la Entrega 2 la VD aparece como "Cambio de respuesta O1→O2", pero el diseño es solo postest: la VD es la congruencia en O1.

## 6. Situaciones

`numero` impar → en el set A se recomienda o1; par → se recomienda o2 (set B al revés).

| # | id | Dominio | Situación | o1 | o2 | Justificación (igual para ambas) |
|---|---|---|---|---|---|---|
| 1 | gafas | Accesorios | Necesitas cambiar tus gafas. En la óptica te muestran dos monturas con el mismo precio, la misma fórmula y la misma garantía; solo cambia el diseño. | Montura negra de pasta | Montura metálica gris | Para algo que vas a usar todos los días, suele funcionar bien elegir lo que te haga sentir a gusto. |
| 2 | chocolate | Alimentación | Quieres darte un gusto después de una semana pesada. En la tienda hay dos chocolates de la misma marca, con el mismo tamaño, el mismo precio y el mismo porcentaje de cacao; solo cambian la forma y la presentación. | Chocolate clásico en barra | Chocolate de diseño geométrico | Para un gusto pequeño, suele valer la pena escoger el que más se te antoje en este momento. |
| 3 | chaqueta | Vestuario | Vas a comprar una chaqueta para las noches frías. Encuentras dos de cuero, de tu talla y al mismo precio; solo cambia el estilo. | Chaqueta café con forro de lana | Chaqueta negra estilo motociclista | Para una prenda que vas a usar seguido, suele funcionar bien la que sientas más acorde contigo. |
| 4 | reloj | Accesorios | Te van a regalar un reloj de cumpleaños y puedes escoger el color. Es el mismo modelo, con las mismas funciones y el mismo precio. | Reloj plateado | Reloj negro | Para un regalo que vas a llevar contigo, suele ser buena idea escoger el que más te guste a primera vista. |
| 5 | sillon | Hogar | Estás arreglando tu cuarto y quieres un sillón para leer. Hay dos que cuestan lo mismo, caben en el espacio y, según quienes los han probado, son igual de cómodos. | Sillón clásico con lana | Sillón moderno con marco metálico | Para un espacio que es tuyo, suele funcionar bien elegir el mueble con el que más te identifiques. |
| 6 | plan | Ocio | Este sábado tienes la tarde libre y quieres salir a despejarte un rato. Hay dos lugares gratuitos, a la misma distancia de tu casa. | Caminar por el parque principal | Recorrer la ciclovía arborizada | Para una tarde libre, lo importante es que el plan te despeje, y esta suele ser una buena forma de lograrlo. |
| 7 | tenis | Vestuario | Necesitas unos tenis para caminar y hacer ejercicio. Encuentras dos pares del mismo color, de tu talla y al mismo precio; los dos son igual de cómodos. | Tenis de suela angular | Tenis de suela ondulada | Para algo que vas a usar casi todos los días, suele convenir el par que más te guste al verlo. |
| 8 | arepa | Alimentación | Es lunes por la mañana, tienes prisa y vas a desayunar algo rápido en una cafetería. Hay dos arepas que cuestan lo mismo y están listas al mismo tiempo. | Arepa con queso derretido | Arepa con queso campesino | Para un lunes con prisa, suele funcionar bien empezar el día con algo que te guste de verdad. |
| 9 | cuaderno | Estudio y trabajo | Vas a la papelería a comprar un cuaderno para tus apuntes. Hay dos del mismo tamaño, con el mismo número de hojas y al mismo precio; solo cambia el color de la portada. | Cuaderno azul | Cuaderno verde | Para algo que vas a usar durante meses, suele convenir elegir el que más te represente. |
| 10 | bicicleta | Movilidad y ocio | Quieres una bicicleta para salir a rodar los fines de semana. Hay dos de tu talla, del mismo color y al mismo precio. | Bicicleta de ruta | Bicicleta de montaña | Para algo que vas a usar en tu tiempo libre, suele funcionar bien escoger la que más ganas te dé de usar. |

Práctica (no se analiza, sin recomendación en ningún grupo): «¿cuál de estas dos figuras te gusta más?» Círculo / Cuadrado.

### Puntos para revisar con los jueces (equiplausibilidad)

- **chaqueta**: el forro de lana puede verse más abrigado para "noches frías".
- **bicicleta**: ruta y montaña sirven para usos distintos; la elección puede depender del terreno y no del gusto.
- **tenis**: los logos (la "N" y las franjas laterales) son reconocibles; la preferencia de marca añade ruido (el contrabalanceo evita que se convierta en sesgo).
- **plan**: las fotos muestran personas distintas (una pareja caminando vs. una mujer trotando).
- **reloj**: el plateado es bastante más luminoso que el negro (más llamativo).

Con el contrabalanceo, ninguno de estos puntos sesga la comparación entre grupos, pero sí agrega ruido. La línea base del control (≈ 50 %) por ítem permite detectar ítems desbalanceados después del piloto.

## 7. Imágenes

- Fuente: `docs/estimulos_originales/` (las 10 imágenes compuestas originales).
- Cada una se dividió en dos opciones y se recortó a **cuadrado de 720 px** (`public/estimulos/<id>_o1.jpg`, `_o2.jpg`), con el producto centrado y el mismo encuadre para ambas.
- `plan`: los paneles originales son panorámicos; se recortó la zona central de cada uno (pareja y fuente / ciclovía con corredora).
- `bicicleta`: se **borraron las marcas** "Cervélo" y "Trek" de los cuadros (retoque por *inpainting*) para que la marca no influya.
- Las marcas "BORNHEROES" (gafas, chocolate, reloj) son idénticas en las dos opciones y no sesgan.
