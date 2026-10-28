import type { LineRecord } from '@/lib/types';

/** How master games from this line finished — counted by the build from pgnmentor, never typed. */
export default function WinBar({ record }: { record: LineRecord }) {
  const label = `${record.games.toLocaleString('en-GB')} master games: White won ${record.white}%, ${record.draw}% drawn, Black won ${record.black}%`;
  return (
    <div className="winbar" title={label}>
      <div className="winbar__bar" role="img" aria-label={label}>
        <span className="winbar__white" style={{ width: `${record.white}%` }} />
        <span className="winbar__draw" style={{ width: `${record.draw}%` }} />
        <span className="winbar__black" style={{ width: `${record.black}%` }} />
      </div>
      <span className="muted small">
        {record.games.toLocaleString('en-GB')} master games · White {record.white}% · draws {record.draw}% · Black {record.black}%
      </span>
    </div>
  );
}
