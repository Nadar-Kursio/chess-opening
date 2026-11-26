import Link from 'next/link';
import Board, { type BoardArrow } from '@/components/Board';
import { prepBadge, prepOf, type Prep } from '@/lib/gamePrep';
import { SITE_NAME, scorePct, type Arrow, type Deviation, type Matched, type Result, type Tally } from '@/lib/games';
import type { Colour } from '@/lib/types';

/* Small pieces the games report and a single game share. */

export const RESULT_LABEL: Record<Result, string> = { win: 'Won', draw: 'Drew', loss: 'Lost' };
const RESULT_LETTER: Record<Result, string> = { win: 'W', draw: 'D', loss: 'L' };

export function ResultChip({ result }: { result: Result }) {
  return (
    <span className={`game-result game-result--${result}`} aria-label={RESULT_LABEL[result]} title={RESULT_LABEL[result]}>
      {RESULT_LETTER[result]}
    </span>
  );
}

/** Wins, draws and losses as one bar, with the score beside it. */
export function TallyBar({ tally, label }: { tally: Tally; label: string }) {
  return (
    <div className="tally">
      <div className="tally__head">
        <span>{label}</span>
        <b>{tally.games ? `${scorePct(tally)}%` : '·'}</b>
      </div>
      <div
        className="tally__bar"
        role="img"
        aria-label={`${tally.win} won, ${tally.draw} drawn, ${tally.loss} lost`}
      >
        {tally.games ? (
          <>
            <span className="tally__win" style={{ flexGrow: tally.win }} />
            <span className="tally__draw" style={{ flexGrow: tally.draw }} />
            <span className="tally__loss" style={{ flexGrow: tally.loss }} />
          </>
        ) : null}
      </div>
      <span className="muted small">
        {tally.games ? `${tally.games} game${tally.games === 1 ? '' : 's'} · ${tally.win}W ${tally.draw}D ${tally.loss}L` : 'No games yet'}
      </span>
    </div>
  );
}

/** A position as a picture: the course's move in green, the move played in red. */
export function PositionBoard({
  fen,
  side,
  course,
  played,
  label,
}: {
  fen: string;
  side: Colour;
  course?: Arrow | null;
  played?: Arrow | null;
  label: string;
}) {
  const arrows: BoardArrow[] = [];
  if (played) arrows.push({ ...played, kind: 'bad' });
  if (course) arrows.push({ ...course, kind: 'good' });
  return (
    <div className="games-board">
      <Board fen={fen} orientation={side === 'white' ? 'w' : 'b'} arrows={arrows} coordinates={false} animate={false} label={label} />
    </div>
  );
}

export function sideName(side: Colour) {
  return side === 'white' ? 'White' : 'Black';
}

export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** Book depth in plies, read as moves: 9 plies is "4.5 moves". */
export const movesText = (plies: number) => {
  const moves = Math.round((plies / 2) * 10) / 10;
  return `${moves} move${moves === 1 ? '' : 's'}`;
};

/** Where to learn a position: the first chapter that teaches it, else its sideline. */
export function teachLink(openingId: string, f: Pick<Deviation, 'teaches'>, lines: { slug: string }[]) {
  const t = f.teaches.find((x) => !x.sideline) ?? f.teaches[0];
  if (!t) return null;
  const index = lines.findIndex((l) => l.slug === t.slug);
  return {
    href: `/openings/${openingId}/${t.slug}/learn`,
    label: t.sideline ? `Learn the sideline` : `Learn chapter ${index + 1}`,
    name: t.name,
  };
}

/** How far a game's prep went, as a coloured pill. */
export function PrepBadge({ prep, muted = false }: { prep: Prep | null; muted?: boolean }) {
  if (!prep) return <span className="prep-badge prep-badge--none">No course</span>;
  return <span className={`prep-badge prep-badge--${muted ? 'none' : prep.kind}`}>{prepBadge(prep)}</span>;
}

/** One imported game in a list, linking to its prep report. `course` names the course it followed. */
export function GameRow({ m, date, course, studied }: { m: Matched; date: (d: Date) => string; course?: string | null; studied: boolean }) {
  const prep = m.walk ? prepOf(m.walk, m.game.moves) : null;
  return (
    <li>
      <Link href={`/games/${m.game.site}/${m.game.id}`} className="game-row">
        <ResultChip result={m.game.result} />
        <span className="game-row__who">
          <b>
            {m.game.opponent}
            {m.game.opponentRating ? <span className="muted"> ({m.game.opponentRating})</span> : null}
          </b>
          <span className="muted small">
            {date(m.game.playedAt)} · {m.game.speed} · {course ?? SITE_NAME[m.game.site]}
          </span>
        </span>
        <PrepBadge prep={prep} muted={!studied} />
      </Link>
    </li>
  );
}
