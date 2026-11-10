import "server-only";
import { neon } from "@neondatabase/serverless";
import { SCHEMA } from "./schema";

/**
 * Acceso a Postgres.
 *  - En Vercel: base Neon creada desde Storage → variable DATABASE_URL
 *    (o POSTGRES_URL). Se usa el driver HTTP de Neon: rápido y sin pool.
 *  - En tu PC con un Postgres local (localhost): se usa `pg`.
 * Todas las consultas van parametrizadas ($1, $2…): nunca concatenes texto
 * que venga del participante.
 */
export type Row = Record<string, any>;
type Runner = (text: string, params: unknown[]) => Promise<Row[]>;
type Stmt = { text: string; params: unknown[] };
type TxRunner = (stmts: Stmt[]) => Promise<Row[][]>;

let runner: Runner | null = null;
let txRunner: TxRunner | null = null;
let schemaReady: Promise<void> | null = null;

function connectionString(): string {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
  if (!url) {
    throw new Error(
      "Falta DATABASE_URL. En Vercel: Storage → conecta la base Neon a este proyecto y vuelve a desplegar.",
    );
  }
  return url;
}

async function getRunner(): Promise<Runner> {
  if (runner) return runner;
  const url = connectionString();
  if (/@(localhost|127\.0\.0\.1)(:\d+)?\//.test(url)) {
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: url, max: 4 });
    runner = async (text, params) => (await pool.query(text, params as unknown[])).rows;
    txRunner = async (stmts) => {
      const c = await pool.connect();
      try {
        await c.query("BEGIN");
        const out: Row[][] = [];
        for (const s of stmts) out.push((await c.query(s.text, s.params as unknown[])).rows);
        await c.query("COMMIT");
        return out;
      } catch (e) {
        await c.query("ROLLBACK");
        throw e;
      } finally {
        c.release();
      }
    };
  } else {
    const sql = neon(url);
    runner = (text, params) => sql.query(text, params as unknown[]) as Promise<Row[]>;
    txRunner = async (stmts) =>
      (await sql.transaction(stmts.map((s) => sql.query(s.text, s.params as unknown[])))) as unknown as Row[][];
  }
  return runner;
}

async function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      const run = await getRunner();
      for (const stmt of SCHEMA) {
        try {
          await run(stmt, []);
        } catch (e: any) {
          // Dos funciones arrancando a la vez pueden chocar al crear la misma tabla: ya existe, se sigue.
          if (!/already exists|duplicate key/i.test(String(e?.message))) throw e;
        }
      }
    })().catch((e) => {
      schemaReady = null; // reintenta en la próxima petición
      throw e;
    });
  }
  return schemaReady;
}

export async function q<T extends Row = Row>(text: string, params: unknown[] = []): Promise<T[]> {
  await ensureSchema();
  const run = await getRunner();
  return (await run(text, params)) as T[];
}

/** Varias sentencias en UNA transacción (todo o nada). Devuelve las filas de cada una. */
export async function tx(stmts: Stmt[]): Promise<Row[][]> {
  await ensureSchema();
  await getRunner();
  return txRunner!(stmts);
}
