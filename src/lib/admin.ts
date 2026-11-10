import "server-only";
import { timingSafeEqual } from "node:crypto";

/** El panel /admin envía la contraseña en la cabecera x-admin-token. */
export function isAdmin(req: Request): boolean {
  const expected = process.env.ADMIN_TOKEN ?? "";
  const got = req.headers.get("x-admin-token") ?? "";
  if (expected.length < 8 || got.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(got), Buffer.from(expected));
}

type Cell = string | number | boolean | Date | object | null | undefined;

/** CSV estándar (coma, punto decimal, UTF-8 con BOM para que Excel respete las tildes). */
export function toCsv(rows: Record<string, Cell>[], columns: string[]): string {
  const esc = (v: Cell) => {
    if (v === null || v === undefined) return "";
    let s: string;
    if (v instanceof Date) s = v.toISOString();
    else if (typeof v === "object") s = JSON.stringify(v);
    else s = String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [columns.join(","), ...rows.map((r) => columns.map((c) => esc(r[c])).join(","))];
  return "﻿" + lines.join("\r\n") + "\r\n";
}
