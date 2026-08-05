import Link from "next/link";
import { getCatalog, getOpening } from "@/lib/content/load";
import { PRIMER_HTML } from "@/components/primerHtml";

/* The front page: the hero introduces the course, the primer teaches the ideas
   every opening leans on, and the catalogue links into the openings. Stats are
   derived, never written down — the counts drifted badly once and cannot again. */

export default function Home() {
  const catalog = getCatalog();
  const lines = catalog.openings.reduce((n, o) => n + o.lines.length, 0);
  const moves = catalog.openings.reduce(
    (n, o) => n + o.lines.reduce((m, l) => m + l.moveCount, 0), 0);
  const stats = [
    { n: catalog.openings.length, word: "openings" },
    { n: lines, word: "annotated lines" },
    { n: moves, word: "explained moves" },
  ];
  const deep = catalog.openings.map((o) => getOpening(o.id));

  return (
    <>
      <header className="hero">
        <ul className="hero__stats">
          {stats.map((s) => (
            <li className="hero__stat" key={s.word}>
              <span className="hero__num">{s.n.toLocaleString("en")}</span>
              <span className="label">{s.word}</span>
            </li>
          ))}
        </ul>
        <h1 className="hero__title">The opening, <em>explained move by move</em></h1>
        <p className="hero__lede">
          Every move on this page comes with a reason. Step through a line, read why
          the move was played, then answer it back on the board — and when your
          opponent plays something else, the course answers <em>that</em> move too.
        </p>
      </header>

      <section className="strategy" aria-label="The openings">
        {catalog.sections.map((sec) => {
          const ops = catalog.openings.filter((o) => o.section === sec.id);
          if (!ops.length) return null;
          return ops.map((o, i) => {
            const op = deep.find((d) => d.id === o.id)!;
            return (
              <div className="card card--wide" key={o.id}>
                {i === 0 ? (
                  <p className="card__head label label--accent">
                    {sec.group} <span className="sep">·</span> <span className="mono">{sec.label}</span>
                  </p>
                ) : null}
                <p>
                  <Link href={`/openings/${o.id}/`}><b>{o.name}</b></Link>{" "}
                  <span className="mono">{o.eco}</span> — {o.tagline}{" "}
                  <span dangerouslySetInnerHTML={{ __html: shortIdea(op.theory.big_idea) }} />
                </p>
              </div>
            );
          });
        })}
      </section>

      <div dangerouslySetInnerHTML={{ __html: PRIMER_HTML }} />
    </>
  );
}

function shortIdea(text: string): string {
  const first = text.split(". ")[0];
  return first.endsWith(".") ? first : first + ".";
}
