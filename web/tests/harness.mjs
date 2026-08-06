/* The jsdom harness for the artifact smoke: loads the ACTUAL exported pages
   from web/out/ — scripts, hydration and all — the way tests/smoke.mjs loaded
   the old single-file build. jsdom has no layout engine, so behaviour is what
   is tested here; pixels are a human's job. */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import jsdom from "jsdom";

const { JSDOM, VirtualConsole, requestInterceptor } = jsdom;

const __dirname = dirname(fileURLToPath(import.meta.url));
export const OUT = join(__dirname, "..", "out");

const TYPES = {
  ".js": "application/javascript",
  ".css": "text/css",
  ".html": "text/html",
  ".json": "application/json",
  ".txt": "text/plain",
};

/* Every asset reference in the export is same-origin; map it back to disk. */
const diskLoader = requestInterceptor((request) => {
  const path = decodeURIComponent(new URL(request.url).pathname);
  try {
    const body = readFileSync(join(OUT, path));
    const ext = path.slice(path.lastIndexOf("."));
    return new Response(body, {
      headers: { "Content-Type": TYPES[ext] || "application/octet-stream" },
    });
  } catch {
    return new Response("", { status: 404 });
  }
});

const IGNORED = [
  /Not implemented: window\.scrollTo/,
  /Not implemented: HTMLCanvasElement/,
  /Could not parse CSS stylesheet/,
];

export async function loadPage(route, { expectIsland = false } = {}) {
  const html = readFileSync(join(OUT, route, "index.html"), "utf-8");
  const errors = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on("error", (...args) => {
    const text = args.map(String).join(" ");
    if (!IGNORED.some((re) => re.test(text))) errors.push(text);
  });
  virtualConsole.on("jsdomError", (err) => {
    const text = String(err && err.message);
    if (!IGNORED.some((re) => re.test(text))) errors.push(text);
  });

  const dom = new JSDOM(html, {
    url: `https://chesslab.dev/${route ? route + "/" : ""}`,
    runScripts: "dangerously",
    resources: { interceptors: [diskLoader] },
    pretendToBeVisual: true,
    virtualConsole,
  });

  const { window } = dom;
  stub(window);

  await until(
    () => window.document.documentElement.dataset.shell === "1"
      && (!expectIsland || window.document.documentElement.dataset.hydrated === "1"),
    `hydration of /${route}`,
    window
  );
  // One breath more, so post-hydration effects (__lab, prefs restore) land.
  await tick(window, 30);

  if (errors.length) {
    throw new Error(`console errors on /${route}:\n  ${errors.join("\n  ")}`);
  }
  return { dom, window, document: window.document, errors };
}

function stub(window) {
  /* Next's client runtime leans on web platform pieces jsdom does not ship;
     Node has them all — bridge them in before the external chunks execute
     (inline scripts have already run by now, which is fine: only the theme
     bootstrap is inline, and it needs none of these). */
  for (const k of [
    "ReadableStream", "WritableStream", "TransformStream", "TextEncoder",
    "TextDecoder", "MessageChannel", "BroadcastChannel", "structuredClone",
  ]) {
    if (!window[k] && globalThis[k]) window[k] = globalThis[k];
  }
  if (!window.matchMedia) {
    window.matchMedia = () => ({
      matches: false, addEventListener() {}, removeEventListener() {},
      addListener() {}, removeListener() {},
    });
  }
  const noop = class { observe() {} unobserve() {} disconnect() {} };
  window.IntersectionObserver = window.IntersectionObserver || noop;
  window.ResizeObserver = window.ResizeObserver || noop;
  /* The arrows layer asks for a 2D context; jsdom has none, and a Proxy that
     absorbs every call is all the smoke needs — the drawing is not the test. */
  window.HTMLCanvasElement.prototype.getContext = function () {
    return new Proxy({}, { get: () => () => {} });
  };
  window.fetch = window.fetch || (() => Promise.resolve({ ok: false, text: () => Promise.resolve("") }));
}

export function tick(window, ms = 20) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function until(fn, what, window, timeout = 5000) {
  const started = Date.now();
  for (;;) {
    let value;
    try { value = fn(); } catch { value = null; }
    if (value) return value;
    if (Date.now() - started > timeout) throw new Error(`timed out waiting for ${what}`);
    await tick(window, 25);
  }
}

/* A rendered "undefined" is a bug wherever it appears — same leak check the
   old harness ran after every step. */
const LEAKS = /\bundefined\b|\bNaN\b|\[object Object\]/;
export function checkLeaks(document, where) {
  /* Rendered text only: the RSC flight payload inside <script> tags spells
     "$undefined" as data, and data is not a leak. */
  const clone = document.body.cloneNode(true);
  clone.querySelectorAll("script, style").forEach((n) => n.remove());
  const text = clone.textContent || "";
  const hit = text.match(LEAKS);
  if (hit) {
    const at = Math.max(0, hit.index - 60);
    throw new Error(`"${hit[0]}" leaked into /${where}: …${text.slice(at, hit.index + 60)}…`);
  }
}

export function fire(window, target, type, init = {}) {
  const Ev = type.startsWith("key") ? window.KeyboardEvent
    : type.startsWith("pointer") ? window.PointerEvent || window.MouseEvent
    : window.Event;
  target.dispatchEvent(new Ev(type, { bubbles: true, cancelable: true, ...init }));
}
