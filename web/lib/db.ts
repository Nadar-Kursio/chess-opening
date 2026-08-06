"use client";

/* Persistence, rebuilt from src/app/scripts/store.js's mechanics on a fresh
   key and schema — the old single-file app's "chessopening" payload is
   deliberately left alone. One key, the version inside the payload, debounced
   writes flushed hard when the page may be going away, and a payload from a
   newer build is read but never overwritten.

   Drill scores are keyed "opId/lineSlug": the slug is the line's stable
   identity here exactly as it is in the URL. Notes are keyed by POSITION
   (turn + board string), so a note follows a transposition and shadows the
   shipped author note for the same position without destroying it. */

export const DB_KEY = "chesslab";
export const DB_VERSION = 1;

export interface NoteRecord {
  text?: string;
  arrows?: { f: string; t: string }[];
  spots?: string[];
}

export interface Db {
  v: number;
  ui: { arrows: boolean; mine: boolean; theme?: string; bothSides?: boolean };
  streak: { cur: number; best: number; day: string };
  lines: Record<string, { asked: number; right: number; hints: number; done: boolean; best: number }>;
  notes: Record<string, NoteRecord>;
}

function dbDefaults(): Db {
  return {
    v: DB_VERSION,
    ui: { arrows: true, mine: true },
    streak: { cur: 0, best: 0, day: "" },
    lines: {},
    notes: {},
  };
}

let dbFrozen = false; // payload came from a newer build: read it, never overwrite
let dbTimer: ReturnType<typeof setTimeout> | null = null;
let listeners: (() => void)[] = [];
let revision = 0;

const dbOK = (() => {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem("__probe", "1");
    window.localStorage.removeItem("__probe");
    return true;
  } catch {
    return false;
  }
})();

function dbMigrate(saved: unknown): Db {
  const out = dbDefaults();
  if (!saved || typeof saved !== "object") return out;
  const s = saved as Record<string, unknown>;
  if ((Number(s.v) | 0) > DB_VERSION) dbFrozen = true;
  for (const k of ["ui", "streak"] as const) {
    if (s[k] && typeof s[k] === "object") Object.assign(out[k], s[k]);
  }
  if (s.lines && typeof s.lines === "object") out.lines = s.lines as Db["lines"];
  if (s.notes && typeof s.notes === "object") out.notes = s.notes as Db["notes"];
  out.v = DB_VERSION;
  return out;
}

export const db: Db = (() => {
  let raw: string | null = null;
  try {
    raw = dbOK ? window.localStorage.getItem(DB_KEY) : null;
  } catch {}
  if (!raw) return dbDefaults();
  try {
    return dbMigrate(JSON.parse(raw));
  } catch {
    return dbDefaults();
  }
})();

/* Debounced: stepping through a line with the arrow keys would otherwise write
   on every keypress. */
export function dbSave(): void {
  if (dbFrozen) return;
  revision += 1;
  listeners.forEach((fn) => fn());
  if (dbTimer) clearTimeout(dbTimer);
  dbTimer = setTimeout(dbFlush, 400);
}

/* When storage is unavailable the live `db` object simply stays session-only —
   there is nothing useful to do with a payload that cannot be written. */
export function dbFlush(): void {
  if (dbTimer) { clearTimeout(dbTimer); dbTimer = null; }
  if (dbFrozen) return;
  if (!dbOK) return;
  try { window.localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch {}
}

if (typeof window !== "undefined") {
  window.addEventListener("visibilitychange", () => { if (document.hidden) dbFlush(); });
  window.addEventListener("pagehide", dbFlush);
}

export function dbTheme(name: string): void {
  db.ui.theme = name;
  dbSave();
}

export function dbLineKey(opId: string, slug: string): string {
  return opId + "/" + slug;
}
export function dbProgress(opId: string, slug: string) {
  return db.lines[dbLineKey(opId, slug)] || null;
}

/* For useSyncExternalStore: the server snapshot is a constant, so prerendered
   HTML shows the empty state and the real numbers arrive after hydration. */
export function dbSubscribe(fn: () => void): () => void {
  listeners.push(fn);
  return () => { listeners = listeners.filter((x) => x !== fn); };
}
export function dbRevision(): number {
  return revision;
}
export function dbServerRevision(): number {
  return -1;
}
