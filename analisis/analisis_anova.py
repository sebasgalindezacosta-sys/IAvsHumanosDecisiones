"""
ANÁLISIS PRINCIPAL — Decisiones cotidianas (IA vs. persona vs. sin recomendación)
================================================================================

Uso (desde la carpeta del repositorio):

    pip install -r analisis/requirements.txt
    python analisis/analisis_anova.py --participantes participantes_2026-11-20.csv --ensayos ensayos_2026-11-20.csv

Para probar el script SIN datos reales (genera 90 participantes simulados):

    python analisis/analisis_anova.py --simular

Los dos CSV se descargan desde https://<tu-proyecto>.vercel.app/admin

Qué hace
--------
1. Filtra participantes: completos, elegibles, 10 ensayos, sin sesiones de prueba
   (+ opcionalmente criterios de exclusión y chequeo de manipulación).
2. Recalcula por persona, a partir de los ENSAYOS ya depurados:
      - pct_congruencia : % de elecciones que coinciden con la opción recomendada
                          (en el control, con la opción meta oculta → línea base ≈ 50 %)
      - media_hacia_meta: posición media del control hacia la opción recomendada/meta
                          (-100 = totalmente hacia la otra, +100 = totalmente hacia la recomendada)
      - media_log_rt    : tiempo de decisión medio (log ms), sin ensayos con la
                          pestaña oculta ni RT > 60 s
3. Para cada variable dependiente: descriptivos, supuestos (Levene, Shapiro),
   ANOVA de un factor + η² y ω², ANOVA de Welch, Tukey HSD, Kruskal-Wallis
   y ANCOVA con la frecuencia de uso de IA como covariable (variable extraña).
4. Contraste planeado IA vs. persona y prueba de la línea base del control (50 %).
5. Guarda resumen y gráficos en analisis/resultados/.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
import pandas as pd
from scipy import stats
import statsmodels.formula.api as smf
from statsmodels.stats.anova import anova_lm
from statsmodels.stats.multicomp import pairwise_tukeyhsd
from statsmodels.stats.oneway import anova_oneway

ORDEN = ["control", "humano", "ia"]
NOMBRE = {"control": "Sin recomendación", "humano": "Persona", "ia": "IA"}
VDS = {
    "pct_congruencia": "Elecciones congruentes con la recomendación (%)",
    "media_hacia_meta": "Posición del control hacia la recomendación (-100 a 100)",
    "media_log_rt": "Tiempo de decisión (log ms)",
}
RT_MAX_MS = 60_000

OUT = Path(__file__).resolve().parent / "resultados"
LOG: list[str] = []


def say(txt: str = "") -> None:
    print(txt)
    LOG.append(txt)


# --------------------------------------------------------------------------
# Datos simulados (solo para probar el flujo)
# --------------------------------------------------------------------------
def simular(n_por_grupo: int = 30, seed: int = 7) -> tuple[pd.DataFrame, pd.DataFrame]:
    rng = np.random.default_rng(seed)
    p_seguir = {"control": 0.50, "humano": 0.64, "ia": 0.57}  # efectos inventados
    filas_p, filas_t = [], []
    k = 0
    for cond in ORDEN:
        for _ in range(n_por_grupo):
            k += 1
            pid = f"S-{k:04d}"
            freq = int(rng.integers(0, 4))
            filas_p.append(
                dict(participante=pid, condicion=cond, es_prueba=0,
                     genero_agente=(("hombre" if k % 2 else "mujer") if cond == "humano" else None), completo=1, elegible=1, n_ensayos=10,
                     incluir_basico=1, excluir_criterios=int(rng.random() < 0.05),
                     manipulacion_ok=int(rng.random() < 0.9), frecuencia_ia_num=freq,
                     edad=int(rng.integers(18, 36)), genero=rng.choice(["Mujer", "Hombre"]))
            )
            sesgo = rng.normal(0, 0.08)
            for pos in range(1, 11):
                sigue = rng.random() < np.clip(p_seguir[cond] + sesgo, 0.05, 0.95)
                fuerza = int(np.clip(rng.normal(55, 25), 1, 100))
                filas_t.append(
                    dict(participante=pid, es_prueba=0, condicion=cond, bloque="main", posicion=pos,
                         congruente=int(sigue), hacia_meta=fuerza if sigue else -fuerza,
                         rt_ms=int(rng.lognormal(7.4 + (0.05 if cond != "control" else 0), 0.45)),
                         ms_fuera=0 if rng.random() > 0.03 else 4000)
                )
    return pd.DataFrame(filas_p), pd.DataFrame(filas_t)


# --------------------------------------------------------------------------
def preparar(p: pd.DataFrame, t: pd.DataFrame, excluir_criterios: bool, solo_manip_ok: bool) -> pd.DataFrame:
    say("=" * 78)
    say("1. DEPURACIÓN")
    say("=" * 78)
    say(f"Participantes en el archivo: {len(p)}")
    p = p[(p["incluir_basico"] == 1)]
    say(f"  completos, elegibles, 10 ensayos y no prueba: {len(p)}")
    if excluir_criterios:
        p = p[p["excluir_criterios"] == 0]
        say(f"  sin criterios de exclusión (no usó IA nunca, formación en IA, estudios previos, conocía el diseño): {len(p)}")
    if solo_manip_ok:
        p = p[p["manipulacion_ok"] == 1]
        say(f"  solo quienes pasaron el chequeo de manipulación: {len(p)}")

    t = t[(t["bloque"] == "main") & (t["participante"].isin(p["participante"]))].copy()
    t_rt = t[(t["ms_fuera"].fillna(0) == 0) & (t["rt_ms"] > 0) & (t["rt_ms"] <= RT_MAX_MS)].copy()
    say(f"Ensayos: {len(t)} · válidos para tiempo (sin salir de la pestaña, RT ≤ {RT_MAX_MS // 1000} s): {len(t_rt)}")
    t_rt["log_rt"] = np.log(t_rt["rt_ms"])

    agg = t.groupby("participante").agg(pct_congruencia=("congruente", lambda s: 100 * s.mean()),
                                        media_hacia_meta=("hacia_meta", "mean"))
    agg_rt = t_rt.groupby("participante").agg(media_log_rt=("log_rt", "mean"), mediana_rt_ms=("rt_ms", "median"))
    cols = ["condicion", "frecuencia_ia_num"] + (["genero_agente"] if "genero_agente" in p.columns else [])
    d = p.set_index("participante")[cols].join(agg).join(agg_rt).reset_index()
    d["condicion"] = pd.Categorical(d["condicion"], categories=ORDEN, ordered=True)
    say("")
    say("N final por grupo: " + ", ".join(f"{NOMBRE[c]} = {(d['condicion'] == c).sum()}" for c in ORDEN))
    return d


def eta_omega(aov: pd.DataFrame) -> tuple[float, float]:
    ss_b, ss_w = aov.loc["C(condicion)", "sum_sq"], aov.loc["Residual", "sum_sq"]
    df_b, df_w = aov.loc["C(condicion)", "df"], aov.loc["Residual", "df"]
    ms_w = ss_w / df_w
    eta2 = ss_b / (ss_b + ss_w)
    omega2 = (ss_b - df_b * ms_w) / (ss_b + ss_w + ms_w)
    return eta2, max(0.0, omega2)


def fmt_p(p: float) -> str:
    return "< .001" if p < 0.001 else f"= {p:.3f}".replace("0.", ".")


def analizar(d: pd.DataFrame, vd: str) -> None:
    x = d.dropna(subset=[vd])
    grupos = [x.loc[x["condicion"] == c, vd].values for c in ORDEN]
    say("")
    say("=" * 78)
    say(f"VD: {VDS[vd]}  [{vd}]")
    say("=" * 78)
    desc = x.groupby("condicion", observed=False)[vd].agg(["count", "mean", "std"])
    for c in ORDEN:
        r = desc.loc[c]
        say(f"  {NOMBRE[c]:<18} n = {int(r['count']):>3}   M = {r['mean']:8.2f}   DE = {r['std']:7.2f}")

    lev = stats.levene(*grupos, center="median")
    say(f"\n  Supuestos · Levene (homogeneidad): F = {lev.statistic:.2f}, p {fmt_p(lev.pvalue)}")
    for c, g in zip(ORDEN, grupos):
        if len(g) >= 3:
            sw = stats.shapiro(g)
            say(f"              Shapiro-Wilk {NOMBRE[c]:<18} W = {sw.statistic:.3f}, p {fmt_p(sw.pvalue)}")

    m = smf.ols(f"{vd} ~ C(condicion)", data=x).fit()
    aov = anova_lm(m, typ=2)
    F, p = aov.loc["C(condicion)", "F"], aov.loc["C(condicion)", "PR(>F)"]
    dfb, dfw = int(aov.loc["C(condicion)", "df"]), int(aov.loc["Residual", "df"])
    eta2, om2 = eta_omega(aov)
    say(f"\n  ANOVA de un factor: F({dfb}, {dfw}) = {F:.2f}, p {fmt_p(p)}, η² = {eta2:.3f}, ω² = {om2:.3f}")

    w = anova_oneway(x[vd], x["condicion"].astype(str), use_var="unequal")
    say(f"  ANOVA de Welch:     F({w.df_num:.0f}, {w.df_denom:.1f}) = {w.statistic:.2f}, p {fmt_p(w.pvalue)}")

    kw = stats.kruskal(*grupos)
    say(f"  Kruskal-Wallis:     H(2) = {kw.statistic:.2f}, p {fmt_p(kw.pvalue)}")

    tk = pairwise_tukeyhsd(x[vd], x["condicion"].astype(str).map(NOMBRE))
    say("\n  Comparaciones post hoc (Tukey HSD; diferencia = segundo grupo − primero):")
    for row in tk.summary().data[1:]:
        g1, g2, dif, padj, lo, hi, _ = row
        say(f"    {g2:>18} − {g1:<18} = {dif:7.2f}  IC95 [{lo:.2f}, {hi:.2f}]  p ajust. {fmt_p(padj)}")

    a, b = grupos[ORDEN.index("ia")], grupos[ORDEN.index("humano")]
    tt = stats.ttest_ind(a, b, equal_var=False)
    dpool = (a.mean() - b.mean()) / np.sqrt((a.var(ddof=1) + b.var(ddof=1)) / 2)
    say(f"\n  Contraste planeado IA vs. persona (Welch): t({tt.df:.1f}) = {tt.statistic:.2f}, p {fmt_p(tt.pvalue)}, d = {dpool:.2f}")

    xc = x.dropna(subset=["frecuencia_ia_num"])
    if xc["frecuencia_ia_num"].nunique() > 1:
        mc = smf.ols(f"{vd} ~ C(condicion) + frecuencia_ia_num", data=xc).fit()
        ac = anova_lm(mc, typ=2)
        say(
            f"  ANCOVA (covariable: frecuencia de uso de IA 0–3): condición F({int(ac.loc['C(condicion)', 'df'])}, "
            f"{int(ac.loc['Residual', 'df'])}) = {ac.loc['C(condicion)', 'F']:.2f}, p {fmt_p(ac.loc['C(condicion)', 'PR(>F)'])}; "
            f"covariable F = {ac.loc['frecuencia_ia_num', 'F']:.2f}, p {fmt_p(ac.loc['frecuencia_ia_num', 'PR(>F)'])}"
        )

    if vd == "pct_congruencia":
        ctl = grupos[ORDEN.index("control")]
        one = stats.ttest_1samp(ctl, 50)
        say(f"  Línea base: congruencia del control vs. 50 %: t({len(ctl) - 1}) = {one.statistic:.2f}, p {fmt_p(one.pvalue)}"
            "  (si es ≠ 50 %, alguna opción meta era más atractiva por sí misma)")

    grafico(x, vd)


def exploratorio_genero_agente(d: pd.DataFrame) -> None:
    """Solo condición "persona": ¿cambia algo si quien recomienda es un hombre o una mujer?
    Es exploratorio (n pequeño): sirve para descartar que una de las dos imágenes arrastre el efecto."""
    if "genero_agente" not in d.columns:
        return
    h = d[d["condicion"] == "humano"]
    if h["genero_agente"].nunique() < 2:
        return
    say("")
    say("=" * 78)
    say("EXPLORATORIO — condición persona: recomendador hombre vs. mujer")
    say("=" * 78)
    for vd in VDS:
        a = h.loc[h["genero_agente"] == "hombre", vd].dropna()
        b = h.loc[h["genero_agente"] == "mujer", vd].dropna()
        if len(a) > 1 and len(b) > 1:
            tt = stats.ttest_ind(a, b, equal_var=False)
            say(f"  {vd:<18} hombre M = {a.mean():7.2f} (n = {len(a)})   mujer M = {b.mean():7.2f} (n = {len(b)})   "
                f"Welch t({tt.df:.1f}) = {tt.statistic:.2f}, p {fmt_p(tt.pvalue)}")


def grafico(x: pd.DataFrame, vd: str) -> None:
    import matplotlib

    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    fig, ax = plt.subplots(figsize=(6, 4.2), dpi=150)
    rng = np.random.default_rng(1)
    for i, c in enumerate(ORDEN):
        g = x.loc[x["condicion"] == c, vd].values
        ax.scatter(i + rng.uniform(-0.12, 0.12, len(g)), g, s=12, alpha=0.45, color="#5b6b7a", zorder=2)
        if len(g):
            m, se = g.mean(), g.std(ddof=1) / np.sqrt(len(g)) if len(g) > 1 else 0
            ax.errorbar(i, m, yerr=1.96 * se, fmt="o", color="#005436", markersize=8, capsize=6, lw=2, zorder=3)
    if vd == "pct_congruencia":
        ax.axhline(50, color="#999", lw=1, ls="--", zorder=1)
    if vd == "media_hacia_meta":
        ax.axhline(0, color="#999", lw=1, ls="--", zorder=1)
    ax.set_xticks(range(3), [NOMBRE[c] for c in ORDEN])
    ax.set_ylabel(VDS[vd])
    ax.set_title("Media ± IC 95 % (puntos = participantes)", fontsize=10)
    ax.spines[["top", "right"]].set_visible(False)
    fig.tight_layout()
    fig.savefig(OUT / f"figura_{vd}.png")
    plt.close(fig)


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--participantes", help="CSV de participantes descargado de /admin")
    ap.add_argument("--ensayos", help="CSV de ensayos descargado de /admin")
    ap.add_argument("--simular", action="store_true", help="usar datos simulados (N = 90) para probar")
    ap.add_argument("--sin-excluir-criterios", action="store_true", help="no aplicar los criterios de exclusión")
    ap.add_argument("--solo-manipulacion-ok", action="store_true", help="analizar solo a quienes pasaron el chequeo")
    a = ap.parse_args()

    OUT.mkdir(exist_ok=True)
    if a.simular:
        p, t = simular()
        say("*** DATOS SIMULADOS: los resultados NO son reales ***\n")
    else:
        if not (a.participantes and a.ensayos):
            ap.error("indica --participantes y --ensayos, o usa --simular")
        p, t = pd.read_csv(a.participantes), pd.read_csv(a.ensayos)

    d = preparar(p, t, excluir_criterios=not a.sin_excluir_criterios, solo_manip_ok=a.solo_manipulacion_ok)
    for vd in VDS:
        analizar(d, vd)
    exploratorio_genero_agente(d)

    d.to_csv(OUT / "datos_por_participante.csv", index=False)
    (OUT / "resumen.txt").write_text("\n".join(LOG), encoding="utf-8")
    say(f"\nResultados guardados en {OUT}")


if __name__ == "__main__":
    main()
