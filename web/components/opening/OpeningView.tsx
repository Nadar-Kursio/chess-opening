import type { Catalog, Opening } from "@/lib/content/types";
import StudyPanel from "@/components/study/StudyPanel";

/* One opening page: the head, the study island, and the server-rendered prose
   around it — the theory cards and the learning path, which is the content a
   search engine (and a reader skimming) actually gets to see. Ported from
   render.js's openingHTML/strategyHTML/pathHTML. */

interface Props {
  opening: Opening;
  lineIndex: number;
  catalog: Catalog;
}

export default function OpeningView({ opening, lineIndex, catalog }: Props) {
  const op = opening;
  const line = op.lines[lineIndex];
  const sec = catalog.sections.find((s) => s.id === op.section)!;
  const side = line.side || op.orientation;
  const t = op.theory;
  const pr = op.progression;

  return (
    <>
      <header className="page-head">
        <div className="page-head__meta label label--accent">
          <span>{sec.group}</span>
          <span className="sep">/</span>
          <span><span className="mono">{sec.label}</span></span>
          <span className="sep">/</span>
          <span><span className="mono">{op.eco}</span></span>
          <span className="sep">/</span>
          <span>You play {side === "black" ? "Black" : "White"}</span>
        </div>
        <h1 className="page-title">{op.name}</h1>
        <p className="page-lede">{op.tagline}</p>
      </header>

      <nav className="sections" aria-label="Sections of this opening">
        <a href={`#moves-${op.id}`}>The moves</a>
        <a href={`#ideas-${op.id}`}>The ideas</a>
        <a href={`#path-${op.id}`}>Learning path</a>
      </nav>

      <StudyPanel opening={op} lineIndex={lineIndex} catalog={catalog} />

      <div className="strategy" id={`ideas-${op.id}`}>
        <div className="card card--wide">
          <p className="card__head label label--accent">The idea in one paragraph</p>
          <p dangerouslySetInnerHTML={{ __html: t.big_idea }} />
        </div>
        <div className="card card--wide">
          <p className="card__head label label--accent">The pawn structure</p>
          <p dangerouslySetInnerHTML={{ __html: t.structure }} />
        </div>
        <div className="card">
          <p className="card__head label label--accent">♔ White&rsquo;s plans</p>
          <ul>{t.white_plans.map((x, i) => <li key={i} dangerouslySetInnerHTML={{ __html: x }} />)}</ul>
        </div>
        <div className="card">
          <p className="card__head label label--accent">♚ Black&rsquo;s plans</p>
          <ul>{t.black_plans.map((x, i) => <li key={i} dangerouslySetInnerHTML={{ __html: x }} />)}</ul>
        </div>
        <div className="card card--warn card--wide">
          <p className="card__head label label--danger">Traps and things that lose games</p>
          <ul>{t.traps.map((x, i) => <li key={i} dangerouslySetInnerHTML={{ __html: x }} />)}</ul>
        </div>
        <div className="strategy__who"><p dangerouslySetInnerHTML={{ __html: t.who }} /></div>
      </div>

      <section className="path" id={`path-${op.id}`}>
        <div className="path__head">
          <p className="label label--accent">Your learning path &mdash; {op.name}</p>
          <span className="pill">{op.level}</span>
        </div>
        <p className="path__arc" dangerouslySetInnerHTML={{ __html: pr.arc }} />
        <ol className="stages">
          {pr.stages.map((st) => (
            <li key={st.tier}>
              <div className="stage__top">
                <span className="stage__name">{st.tier}</span>
                <span className="label">{st.when}</span>
              </div>
              <p className="stage__goal"><b>Goal.</b> <span dangerouslySetInnerHTML={{ __html: st.goal }} /></p>
              <ul className="stage__learn">
                {st.learn.map((x, i) => <li key={i} dangerouslySetInnerHTML={{ __html: x }} />)}
              </ul>
              <div className="stage__fact"><span className="label">Drill</span><span dangerouslySetInnerHTML={{ __html: st.drill }} /></div>
              <div className="stage__fact stage__fact--warn"><span className="label">Common mistake</span><span dangerouslySetInnerHTML={{ __html: st.mistake }} /></div>
              <div className="stage__fact stage__fact--ok"><span className="label">Move on when</span><span dangerouslySetInnerHTML={{ __html: st.ready }} /></div>
            </li>
          ))}
        </ol>
        <div className="path__foot">
          <div className="card">
            <p className="card__head label label--accent">Whose games to study</p>
            <p dangerouslySetInnerHTML={{ __html: pr.study }} />
          </div>
          <div className="card">
            <p className="card__head label label--accent">What to learn after this</p>
            <p dangerouslySetInnerHTML={{ __html: pr.next }} />
          </div>
        </div>
      </section>
    </>
  );
}
