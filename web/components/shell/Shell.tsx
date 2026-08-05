"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { OpeningSummary, Section } from "@/lib/content/types";
import { announce } from "@/lib/announce";
import { db, dbRevision, dbServerRevision, dbSubscribe, dbTheme } from "@/lib/db";
import { FEEDBACK_LEVELS } from "@/lib/study/drill";

/* The app bar and the course nav — one nav, presented two ways: a rail beside
   the content on a wide screen, the same markup sliding in over it on a narrow
   one. Ported from appbar.js + nav.js; the markup and class names are theirs,
   so the shell/nav stylesheets apply unchanged. */

interface Props {
  sections: Section[];
  openings: OpeningSummary[];
  children: React.ReactNode;
}

function themeName(): string {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.getAttribute("data-theme") || "dark";
}

export default function Shell({ sections, openings, children }: Props) {
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);
  const [query, setQuery] = useState("");
  // Theme state mirrors the <html> attribute; the attribute is the live value.
  const [theme, setTheme] = useState("dark");
  const navRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useSyncExternalStore(dbSubscribe, dbRevision, dbServerRevision);
  const mounted = useMounted();

  useEffect(() => {
    setTheme(themeName());
    // The artifact smoke awaits this instead of guessing at a timeout.
    document.documentElement.dataset.shell = "1";
  }, []);

  /* The drawer covers the page, so Tab must not walk out of it, and Escape
     closes it. */
  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeNav();
        return;
      }
      if (e.key !== "Tab" || !navRef.current) return;
      const items = [...navRef.current.querySelectorAll<HTMLElement>("button, input, a")]
        .filter((el) => !el.closest("[hidden]"));
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      const on = document.activeElement;
      const outside = !navRef.current.contains(on);
      if (e.shiftKey ? outside || on === first : outside || on === last) {
        (e.shiftKey ? last : first).focus();
        e.preventDefault();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [navOpen]);

  const openNav = () => {
    setNavOpen(true);
    /* Focus lands on Close, not on the filter: focusing the text field on a
       phone opened the keyboard over the nav it had just opened. */
    requestAnimationFrame(() => {
      navRef.current?.querySelector<HTMLElement>("[data-nav='close']")?.focus();
    });
  };
  const closeNav = () => {
    setNavOpen(false);
    toggleRef.current?.focus();
  };

  const toggleTheme = () => {
    const next = themeName() === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    dbTheme(next);
    setTheme(next);
    announce(`${next === "light" ? "Light" : "Dark"} theme.`);
  };

  const whereAmI = (() => {
    const parts = (pathname || "/").split("/").filter(Boolean);
    if (!parts.length) return "How openings work";
    if (parts[0] === "openings") {
      if (parts.length === 1) return "The course";
      const op = openings.find((o) => o.id === parts[1]);
      return op ? op.name : "The course";
    }
    return "The course";
  })();

  const q = query.trim().toLowerCase();
  const hit = (name: string) => !q || name.toLowerCase().includes(q);
  const shown =
    hit("How openings work") ? 1 : 0;
  const anyOpening = openings.some((o) => hit(o.name));
  const empty = q && !shown && !anyOpening;

  const to = theme === "light" ? "dark" : "light";
  const themeHow = db.ui.theme ? "" : ", which is currently following your system";
  const drilled = mounted ? Object.keys(db.lines).length : 0;
  const best = mounted ? db.streak.best : 0;

  const navItem = (
    href: string, label: string, meta: string, current: boolean,
    extra?: { tag?: React.ReactNode; title?: string }
  ) =>
    hit(label) ? (
      <Link
        key={href}
        className="nav__item"
        href={href}
        prefetch={false}
        aria-current={current ? "page" : undefined}
        title={extra?.title}
        onClick={() => setNavOpen(false)}
      >
        <span className="nav__row">{label}{extra?.tag}</span>
        {meta ? <span className="nav__meta">{meta}</span> : null}
      </Link>
    ) : null;

  const isOp = (id: string) => {
    const parts = (pathname || "").split("/").filter(Boolean);
    return parts[0] === "openings" && parts[1] === id;
  };

  return (
    <>
      <header className="appbar">
        <button
          ref={toggleRef}
          className="appbar__menu"
          id="navtoggle"
          aria-expanded={navOpen}
          aria-controls="nav"
          aria-label="Open the course menu"
          onClick={() => (navOpen ? closeNav() : openNav())}
        >
          <span aria-hidden="true">☰</span>
        </button>
        <Link className="appbar__brand" href="/" prefetch={false} onClick={() => setNavOpen(false)}>
          <span className="appbar__mark" aria-hidden="true">♞</span>
          <span className="appbar__name">Opening Lab</span>
        </Link>
        <span className="appbar__where" id="appbar-where">{whereAmI}</span>
        <div className="appbar__actions" id="appbar-actions">
          <span className="pill" id="progresschip" aria-label="Your progress">
            <span className="glyph" aria-hidden="true">◔</span>
            {drilled ? (
              <>
                <b>{drilled}</b>
                <span className="pill__word">
                  drilled{best ? <> <span className="sep">·</span> best <b>{best}</b></> : null}
                </span>
              </>
            ) : (
              <span className="pill__word">Progress</span>
            )}
          </span>
          <button
            className="pill"
            id="themetoggle"
            aria-label={`Switch to the ${to} theme`}
            title={`Switch to the ${to} theme${themeHow}`}
            onClick={toggleTheme}
          >
            <span className="glyph" aria-hidden="true">{to === "light" ? "☀" : "☾"}</span>
            <span className="pill__word">{to}</span>
          </button>
        </div>
      </header>

      <button
        className={`scrim${navOpen ? " open" : ""}`}
        id="scrim"
        hidden={!navOpen}
        aria-label="Close the course menu"
        onClick={closeNav}
      ></button>

      <div className="shell">
        <nav className={`nav scroller${navOpen ? " open" : ""}`} id="nav" aria-label="Course" ref={navRef}>
          <button className="nav__close" data-nav="close" onClick={closeNav}>
            Close<span aria-hidden="true">✕</span>
          </button>
          <div className="nav__tools">
            <input
              className="field"
              id="navfilter"
              type="search"
              autoComplete="off"
              placeholder="Filter the course…"
              aria-label="Filter the course"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {empty ? <p className="nav__empty">Nothing matches “{q}”.</p> : null}

          {hit("How openings work") ? (
            <div className="nav__group">
              <div className="nav__head"><span className="label">Start here</span></div>
              {navItem("/", "How openings work", "Principles · glossary", (pathname || "/") === "/")}
            </div>
          ) : null}

          {sections.map((sec) => {
            const body = openings
              .filter((o) => o.section === sec.id && hit(o.name))
              .map((o) => {
                /* The badge marks an opening that cannot yet answer a wrong
                   move — it only shows when it means something. */
                const lv = o.feedback;
                const tag =
                  lv < 2 ? (
                    <b className={`nav__feedback nav__feedback--${lv}`}>{FEEDBACK_LEVELS[lv].tag}</b>
                  ) : undefined;
                const title =
                  `${FEEDBACK_LEVELS[lv].tag} — ${FEEDBACK_LEVELS[lv].blurb}` +
                  (o.deviations ? `, with ${o.deviations} deviations written` : "");
                return navItem(`/openings/${o.id}/`, o.name, o.eco, isOp(o.id), { tag, title });
              });
            if (!body.some(Boolean)) return null;
            return (
              <div className="nav__group" key={sec.id}>
                <div className="nav__head">
                  <span className="label">{sec.group}</span>
                  {sec.label ? <span className="nav__moves">{sec.label}</span> : null}
                </div>
                {body}
              </div>
            );
          })}
        </nav>
        <main className="main" id="main" tabIndex={-1}>
          <div id="content">{children}</div>
        </main>
      </div>
    </>
  );
}

/* Storage-dependent numbers render their empty state on the server and fill in
   after mount — the standard way to keep prerendered HTML hydration-clean. */
function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
