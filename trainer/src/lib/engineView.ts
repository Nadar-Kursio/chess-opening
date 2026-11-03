import type { Mark, MoveScore, Ply, Severity } from './types.ts';

/* Presents the engine's numbers: the eval bar, the move marks, and what a wrong move scored. All of
   it was searched ahead of time and shipped; nothing here plays or judges a move. */

export const MARK_GLYPH: Record<Mark, string> = { brilliant: '!!', great: '!', inaccuracy: '?!', blunder: '??' };

type Score = Pick<Ply, 'ev' | 'mate'>;

/** White's score, as a player reads it. */
export function evalText({ ev, mate }: Score) {
  if (mate === 0) return '#';
  if (mate !== undefined) return `${mate > 0 ? '' : '−'}M${Math.abs(mate)}`;
  const value = ev ?? 0;
  return `${value > 0 ? '+' : value < 0 ? '−' : ''}${(Math.abs(value) / 100).toFixed(2)}`;
}

/** White's share of the bar: the gap between +0.2 and +0.8 shows, and the gap between +8 and +12 doesn't. */
export function evalShare({ ev, mate }: Score) {
  if (mate !== undefined) return (mate === 0 ? (ev ?? 0) >= 0 : mate > 0) ? 100 : 0;
  return 100 / (1 + Math.exp(-0.00368208 * Math.max(-1500, Math.min(1500, ev ?? 0))));
}

export interface Verdict extends Score {
  from: string;
  to: string;
  san: string;
  sev: 'good' | 'inaccuracy' | 'blunder';
  glyph: string;
}

const SEVERITIES: Record<MoveScore[2], Verdict['sev']> = { g: 'good', i: 'inaccuracy', b: 'blunder' };
const AUTHORED: Record<Severity, Verdict['sev']> = { playable: 'good', inaccuracy: 'inaccuracy', blunder: 'blunder' };

/** What the engine made of a move the learner tried. An authored severity for the same move outranks it. */
export function verdictOf(position: Pick<Ply, 'verdicts'>, from: string, to: string, authored?: Severity): Verdict | null {
  const scored = position.verdicts?.[from + to];
  if (!scored) return null;
  const [san, ev, code, mate] = scored;
  const sev = authored ? AUTHORED[authored] : SEVERITIES[code];
  return { from, to, san, ev, mate, sev, glyph: sev === 'good' ? '' : MARK_GLYPH[sev] };
}

/** The coach's words for it. `num` is any move from the same turn ("6.Qb3"), for its number. */
export function verdictWords(v: Verdict, position: Score, num: string) {
  const prefix = num.match(/^\d+\.+/)?.[0] ?? '';
  if (v.sev === 'good') {
    return {
      title: `${prefix}${v.san} is a good move too`,
      text: `The engine has it at ${evalText(v)}. The course plays something else here.`,
    };
  }
  const before = position.ev !== undefined ? `from ${evalText(position)} ` : '';
  return { title: `${prefix}${v.san}${v.glyph}`, text: `That takes the score ${before}to ${evalText(v)}.` };
}
