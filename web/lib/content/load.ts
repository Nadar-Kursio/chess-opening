import "server-only";
import { readFileSync } from "fs";
import { join } from "path";
import type { Catalog, Opening } from "./types";

/* Build-time reads only: every page is statically generated, and nothing under
   web/content/ is served at runtime. The directory is generated and gitignored,
   which is why a missing file gets a message instead of an ENOENT trace. */

const ROOT = join(process.cwd(), "content");

function read(name: string): string {
  try {
    return readFileSync(join(ROOT, name), "utf-8");
  } catch {
    throw new Error(
      `web/content/${name} is missing — run: .venv/bin/python3 src/build.py --emit`
    );
  }
}

let catalog: Catalog | null = null;
const openings = new Map<string, Opening>();

export function getCatalog(): Catalog {
  if (!catalog) {
    catalog = JSON.parse(read("catalog.json")) as Catalog;
    if (!catalog.sections?.length || !catalog.openings) {
      throw new Error("web/content/catalog.json has no catalogue in it — re-run --emit");
    }
  }
  return catalog;
}

export function getPrimer(): string {
  return read("primer.html");
}

export function getOpening(id: string): Opening {
  let op = openings.get(id);
  if (!op) {
    op = JSON.parse(read(join("openings", `${id}.json`))) as Opening;
    if (op.id !== id || !op.lines?.length) {
      throw new Error(`web/content/openings/${id}.json does not describe ${id} — re-run --emit`);
    }
    openings.set(id, op);
  }
  return op;
}
