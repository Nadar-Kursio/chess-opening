import type { Metadata } from "next";
import Link from "next/link";
import { getCatalog } from "@/lib/content/load";

export const metadata: Metadata = {
  title: "The openings",
  description: "Every opening in the course, grouped by family, with its variations.",
};

export default function Openings() {
  const catalog = getCatalog();
  return (
    <>
      <header className="page-head">
        <div className="page-head__meta label label--accent"><span>The course</span></div>
        <h1 className="page-title">The openings</h1>
        <p className="page-lede">
          Grouped the way every opening book groups them. Each opening teaches a
          handful of variations; each variation is a page of its own.
        </p>
      </header>
      {catalog.sections.map((sec) => {
        const ops = catalog.openings.filter((o) => o.section === sec.id);
        if (!ops.length) return null;
        return (
          <section className="path" key={sec.id} aria-label={sec.group}>
            <div className="path__head">
              <p className="label label--accent">{sec.group}</p>
              <span className="pill mono">{sec.label}</span>
            </div>
            <ol className="stages">
              {ops.map((o) => (
                <li key={o.id}>
                  <div className="stage__top">
                    <span className="stage__name">
                      <Link href={`/openings/${o.id}/`}>{o.name}</Link>
                    </span>
                    <span className="label mono">{o.eco}</span>
                  </div>
                  <p className="stage__goal">{o.tagline}</p>
                  <ul className="stage__learn">
                    {o.lines.map((l, i) => (
                      <li key={l.slug}>
                        <Link href={i === 0 ? `/openings/${o.id}/` : `/openings/${o.id}/${l.slug}/`}>
                          {l.name}
                        </Link>{" "}
                        — {l.moveCount} moves{l.side && l.side !== o.orientation ? `, played as ${l.side === "black" ? "Black" : "White"}` : ""}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </section>
        );
      })}
    </>
  );
}
