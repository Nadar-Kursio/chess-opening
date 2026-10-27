import MiniBoard from '@/components/ui/MiniBoard';
import { getCatalog, getOpening } from '@/lib/content';

/** A picture of what the course teaches: the first engine-marked brilliant move it has. */
function hero() {
  const ids = getCatalog().openings.map((o) => o.id);
  const id = ids.includes('friedliver') ? 'friedliver' : ids[0];
  const plies = getOpening(id).lines[0].plies;
  return plies.find((p) => p.mark === 'brilliant') ?? plies[Math.min(8, plies.length - 1)];
}

export default function AuthCard({ title, lead, children }: { title: string; lead: string; children: React.ReactNode }) {
  const board = hero();
  return (
    <main className="auth">
      <div className="auth__art">
        <div className="auth__brand">
          <span className="brand__mark" aria-hidden="true">
            <img src="/pieces/wN.svg" alt="" />
          </span>
          ChessLab
        </div>
        <div className="auth__board">
          <MiniBoard fen={board.fen} last={board} />
        </div>
        <p className="auth__pitch">
          Learn your openings the way they stick: a lesson, then drills, then quizzes — and free practice against every
          line the course knows.
        </p>
      </div>
      <div className="card auth__card">
        <h1>{title}</h1>
        <p className="muted">{lead}</p>
        {children}
      </div>
    </main>
  );
}
