# Decisiones cotidianas — IA vs. persona vs. sin recomendación

Experimento en línea: **¿cambia una decisión cotidiana según quién la recomienda?**
Universidad de Cundinamarca · Programa de Psicología, Facatativá · Diseños de investigación I – Psicometría General.

Next.js 16 · Postgres (Neon, creado desde Vercel) · Vercel

---

## El diseño en una mirada

| | |
|---|---|
| **VI (entre sujetos)** | Fuente de la recomendación: `control` (sin recomendación) · `humano` (una persona) · `ia` (una inteligencia artificial). Cada persona ve **una sola** condición, asignada al azar con balanceo (ver abajo). |
| **Tarea** | 10 situaciones cotidianas con dos imágenes (izquierda / derecha). Se elige con un **control deslizante bilateral** de −100 a +100. |
| **VD 1 – decisión** | % de elecciones congruentes con la opción recomendada (en el control, con una opción "meta" oculta → línea base ≈ 50 %). |
| **VD 2 – posición del control** | Media de `hacia_meta`: −100 = totalmente hacia la otra opción, +100 = totalmente hacia la recomendada. |
| **VD 3 – tiempo de decisión** | `rt_ms`: desde que el control se activa hasta «Confirmar» (análisis en log). |
| **Variable extraña** | Frecuencia de uso de IA en el último mes (al final) → covariable en ANCOVA. |
| **Análisis** | ANOVA de un factor por VD (+ Welch, Tukey, Kruskal-Wallis, ANCOVA). Script: `analisis/analisis_anova.py`. |

**Contrabalanceo** (`src/lib/trialPlan.ts`): orden de las 10 situaciones al azar por persona; opción recomendada 5 veces "o1" y 5 veces "o2" (set A/B, balanceado dentro de cada grupo); opción recomendada 5 veces a la izquierda y 5 a la derecha.

**Asignación** (`src/lib/assign.ts`): cada persona elegible va al grupo con menos casos (empates al azar) y, dentro, al set A/B con menos casos. Quien abandona deja de contar a los 45 min, así los grupos terminan iguales en casos **completos** (30/30/30).

Flujo: inicio → consentimiento → datos generales → instrucciones (+ presentación del agente) → 1 práctica → 10 situaciones → preguntas finales (chequeo de manipulación, uso de IA, exclusión) → debriefing.

Más detalle del diseño, las situaciones y el porqué de cada decisión: [`docs/diseno.md`](docs/diseno.md). Variables: [`docs/codebook.md`](docs/codebook.md).

---

## 1. Subir a GitHub (Git Bash)

El repositorio ya existe: `sebasgalindezacosta-sys/IAvsHumanosDecisiones`.

```bash
cd "/c/Users/sebas/OneDrive/Escritorio/U Cundinamarca/Clases/Diseños de investigación I/Proyecto IA/IAvsHumanosDecisiones"

git init
git add .
git commit -m "Experimento IA vs persona vs control: slider, contrabalanceo, Neon y panel"
git branch -M main
git remote add origin https://github.com/sebasgalindezacosta-sys/IAvsHumanosDecisiones.git
git push -u origin main
```

Si GitHub responde que el repositorio ya tiene archivos (por ejemplo un README creado desde la web):

```bash
git pull origin main --allow-unrelated-histories   # si abre un editor, guarda y cierra
git push -u origin main
```

> No subas el archivo `.env.local` (ya está en `.gitignore`).

---

## 2. Vercel + base de datos (todo desde vercel.com)

1. **Importar**: Vercel → *Add New… → Project* → importa `IAvsHumanosDecisiones` → *Deploy*. (El primer despliegue abre, pero dirá "base de datos sin conectar": es normal.)
2. **Crear la base**: en el proyecto → pestaña **Storage** → *Create Database* → **Neon** (Serverless Postgres) → plan **Free** → región **US East (N. Virginia)** (la misma de las funciones de Vercel; así cada respuesta se guarda más rápido) → *Create*.
3. **Conectarla**: en la base recién creada → *Connect Project* → elige este proyecto y marca *Production*, *Preview* y *Development* → *Connect*. Vercel crea sola la variable `DATABASE_URL`.
4. **Contraseña del panel**: *Settings → Environment Variables* → agrega `ADMIN_TOKEN` con una clave larga (p. ej. 20 caracteres) → *Save*.
5. **Volver a desplegar**: *Deployments* → menú ⋯ del último → *Redeploy* (las variables nuevas solo aplican a despliegues nuevos).

Las **tablas se crean solas** con la primera visita; no hay que pegar SQL en ningún lado (copia legible en `db/schema.sql`). Cada `git push` a `main` vuelve a desplegar automáticamente.

---

## 3. Enlaces para aplicar

| Enlace | Para qué |
|---|---|
| `https://<tu-proyecto>.vercel.app/` | Enlace real para participantes |
| `…/?src=whatsapp` (o `instagram`, `clase`, …) | Igual, pero guarda de dónde vino la persona (`fuente_enlace`) |
| `…/?test=1` | **Pilotos y pruebas**: quedan marcadas como prueba, no cuentan para el balanceo y no salen en el CSV salvo que lo pidas |
| `…/admin` | Panel de investigadoras: cuántos van por grupo y descarga de CSV |

Si aplican en persona con **un mismo computador o celular**, al terminar cada participante la página de inicio ofrece «Participa otra persona en este dispositivo».

---

## 4. Datos y análisis

En `/admin` → contraseña (`ADMIN_TOKEN`) → **Participantes** (1 fila por persona, ya con los promedios) y **Ensayos** (1 fila por situación).

- **JASP / jamovi / SPSS**: abre `participantes_….csv`, filtra `incluir_basico = 1` y `excluir_criterios = 0`, y corre el ANOVA con `condicion` como factor y `pct_congruencia`, `media_hacia_meta` o `media_log_rt` como VD.
- **Python** (recalcula todo desde los ensayos depurados y genera figuras):
  ```bash
  pip install -r analisis/requisitos.txt
  python analisis/analisis_anova.py --participantes participantes_AAAA-MM-DD.csv --ensayos ensayos_AAAA-MM-DD.csv
  python analisis/analisis_anova.py --simular      # prueba con 90 participantes inventados
  ```
  Opciones: `--solo-manipulacion-ok`, `--sin-excluir-criterios`. Resultados en `analisis/resultados/`.

---

## 5. Dónde cambiar cosas

| Quiero cambiar… | Archivo |
|---|---|
| Nombres del equipo, correo de contacto, rango de edad, tiempo de bloqueo del control, "una persona" ↔ "un amigo" | `src/data/estudio.ts` |
| Situaciones, opciones, justificaciones de las recomendaciones | `src/data/items.ts` |
| Consentimiento, instrucciones, debriefing, opciones de respuesta | `src/data/textos.ts` |
| Imágenes de las situaciones | `public/estimulos/<id>_o1.jpg` y `_o2.jpg` (cuadradas) |
| Imágenes de los agentes | `public/agentes/ia.jpg`, `humano_hombre.jpg`, `humano_mujer.jpg` (cuadradas, ≥ 512 px; mismos nombres). Prompts en `docs/prompts_agentes.md` |
| Colores | `src/app/globals.css` (`--brand`) |

> Cambiar situaciones o textos **después** de empezar la recolección rompe la comparabilidad: hazlo solo antes del piloto.

---

## 6. Correr en tu PC (opcional)

```bash
cp .env.example .env.local    # pega la DATABASE_URL de Vercel → Storage → tu base → .env.local, y un ADMIN_TOKEN
npm install
npm run dev                   # http://localhost:3000/?test=1
```

Requisitos: Node.js 20 o superior.
