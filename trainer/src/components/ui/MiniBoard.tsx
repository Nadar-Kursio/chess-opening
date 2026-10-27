/* A static board picture for cards and headers: no interaction, no client code. */

const FILES = 'abcdefgh';

export default function MiniBoard({
  fen,
  flipped = false,
  last,
}: {
  fen: string;
  flipped?: boolean;
  last?: { from: string | null; to: string | null } | null;
}) {
  const cells = [];
  for (let k = 0; k < 64; k++) {
    const i = flipped ? 63 - k : k;
    const sq = FILES[i % 8] + (8 - Math.floor(i / 8));
    const ch = fen[i];
    const light = (i % 8) % 2 === Math.floor(i / 8) % 2;
    const cls = `mini__sq ${light ? 'sq--light' : 'sq--dark'}${last && (sq === last.from || sq === last.to) ? ' sq--last' : ''}`;
    cells.push(
      <span key={k} className={cls}>
        {ch !== '.' ? (
          <img src={`/pieces/${ch === ch.toUpperCase() ? 'w' : 'b'}${ch.toUpperCase()}.svg`} alt="" />
        ) : null}
      </span>,
    );
  }
  return (
    <div className="mini" aria-hidden="true">
      {cells}
    </div>
  );
}
