import { baitOf, type Bait, type TrapMeeting, type TrapOutcome } from './gameTraps.ts';
import type { Result, Site } from './games.ts';
import type { Colour, Opening } from './types.ts';

/* The traps the learner has met, as the games report lists them and the collection shows them:
   one entry per trap course, whatever order it was met in. Pure, so tests/gameTraps.test.ts
   checks the counting. */

/** A trap met in a real game or a sparring game, as playRecord.ts reads it. */
export interface TrapEvent extends TrapMeeting {
  at: Date;
  source: 'game' | 'spar';
  /** The imported game, for an event from one. */
  game?: { site: Site; id: string; result: Result; opponent: string; colour: Colour };
  /** The course sparred, for an event from sparring. */
  openingId?: string;
}

export interface TrapTally {
  win: number;
  draw: number;
  loss: number;
}

export interface TrapEntry {
  id: string;
  name: string;
  setter: Colour;
  bait: Bait | null;
  /** Newest first, per outcome. */
  events: Record<TrapOutcome, TrapEvent[]>;
  /** Real games only, by how they ended: sparring games have no result. */
  results: Record<TrapOutcome, TrapTally>;
  /** When the learner first and last sprang it. */
  first: Date | null;
  last: Date | null;
  /** Sprung, and the punishing move followed every time it could be checked. */
  punishedAll: boolean;
}

const empty = (): TrapTally => ({ win: 0, draw: 0, loss: 0 });

/** One entry per trap course, in the order given, met or not. */
export function trapEntries(traps: Opening[], events: TrapEvent[]): TrapEntry[] {
  return traps.map((op) => {
    const mine = events.filter((e) => e.trapId === op.id).sort((a, b) => b.at.getTime() - a.at.getTime());
    const by = (o: TrapOutcome) => mine.filter((e) => e.outcome === o);
    const entry: TrapEntry = {
      id: op.id,
      name: op.name,
      setter: op.orientation,
      bait: baitOf(op),
      events: { sprung: by('sprung'), caught: by('caught'), dodged: by('dodged') },
      results: { sprung: empty(), caught: empty(), dodged: empty() },
      first: null,
      last: null,
      punishedAll: false,
    };
    for (const e of mine) if (e.game) entry.results[e.outcome][e.game.result]++;
    const sprung = entry.events.sprung;
    if (sprung.length) {
      entry.last = sprung[0].at;
      entry.first = sprung[sprung.length - 1].at;
      entry.punishedAll = sprung.every((e) => e.punished !== false);
    }
    return entry;
  });
}

export const metEntries = (entries: TrapEntry[]) =>
  entries.filter((e) => e.events.sprung.length + e.events.caught.length + e.events.dodged.length > 0);
