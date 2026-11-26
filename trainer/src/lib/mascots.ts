import { RANKS } from './xp.ts';

/* The companions a learner picks, and how each one's look grows with rank. Pure, so
   tests/mascots.test.ts can check every rank has a look and every line passes the prose rules.
   The drawings are in components/mascot/Mascot.tsx. */

export type MascotId = 'pip' | 'jinx' | 'hoot' | 'brick' | 'nova' | 'rufus';

/** `good` after a clean or strong result, `mixed` after misses, `level` on a new level. */
export type Mood = 'good' | 'mixed' | 'level';

export interface MascotDef {
  id: MascotId;
  name: string;
  /** What it is, after the name: "Pip, a brave little pawn". */
  kind: string;
  blurb: string;
  lines: Record<Mood, string[]>;
}

export const MASCOTS: MascotDef[] = [
  {
    id: 'pip',
    name: 'Pip',
    kind: 'a brave little pawn',
    blurb: 'Small, stubborn and always first into the fight.',
    lines: {
      good: ['One step at a time, and look where we are.', 'Forward! Always forward.', 'That was brave. I liked it.'],
      mixed: ['Pawns never step back. Neither do we.', 'We get it next time. I can feel it.', 'Every pawn trips once. Up we get.'],
      level: ['Look at me. I’m growing up!', 'Still small. Getting less small.'],
    },
  },
  {
    id: 'jinx',
    name: 'Jinx',
    kind: 'a cheeky knight',
    blurb: 'Hops over everything, rules included.',
    lines: {
      good: ['Ha! They never saw that coming.', 'Sneaky. I approve.', 'Over the top and round the side. Lovely.'],
      mixed: ['Even I trip over my own hooves.', 'Shake it off. We sneak back in later.', 'A few wrong turns. Knights love a detour.'],
      level: ['New look. Same trouble.', 'Do I look dashing? I look dashing.'],
    },
  },
  {
    id: 'hoot',
    name: 'Hoot',
    kind: 'a wise old owl bishop',
    blurb: 'Sees the long diagonals. Takes notes on everything.',
    lines: {
      good: ['Very well played. I took notes.', 'A tidy round. Most satisfying.', 'You saw the whole diagonal there.'],
      mixed: [
        'A miss today is a move you keep tomorrow.',
        'Sleep on it. Memory likes a night’s rest.',
        'Every mistake is a lesson that came early.',
      ],
      level: ['Ah. A fitting look, I think.', 'Wisdom suits you. And me.'],
    },
  },
  {
    id: 'brick',
    name: 'Brick',
    kind: 'a sturdy rook',
    blurb: 'Slow to start, impossible to knock over.',
    lines: {
      good: ['Solid. Like me.', 'Not a crack in that wall.', 'Steady hands, good moves.'],
      mixed: ['Walls go up one brick at a time.', 'No rush. We go again.', 'A wobble. Still standing.'],
      level: ['Bigger. Stronger. Still a tower.', 'Nice. I feel taller already.'],
    },
  },
  {
    id: 'nova',
    name: 'Nova',
    kind: 'a bold queen',
    blurb: 'Goes anywhere, fast. Never waits to be asked.',
    lines: {
      good: ['That’s how it’s done!', 'Fast, sharp, spot on.', 'Did you see that? Everyone saw that.'],
      mixed: ['Bold moves miss sometimes. Make another.', 'Shrug it off and strike again.', 'Next round is ours. Mark my words.'],
      level: ['Now everyone will notice us.', 'This look is very me.'],
    },
  },
  {
    id: 'rufus',
    name: 'Rufus',
    kind: 'a lion cub who would be king',
    blurb: 'Big roar, bigger heart, still growing into the mane.',
    lines: {
      good: ['Roar! What a round.', 'The whole board is ours today.', 'That felt very royal.'],
      mixed: ['Even kings stumble. Then they get up.', 'Deep breath. We’ve got this.', 'Not our best roar. Next one will be.'],
      level: ['Do I look royal yet? I feel royal.', 'One step closer to the throne.'],
    },
  },
];

export function mascotById(id: string | null | undefined): MascotDef | null {
  return MASCOTS.find((m) => m.id === id) ?? null;
}

export function isMascotId(id: unknown): id is MascotId {
  return typeof id === 'string' && MASCOTS.some((m) => m.id === id);
}

/* ---------- looks ---------- */

export type MedalTier = 'bronze' | 'silver' | 'gold';

/** What the mascot wears at one stage. Stages are rank indexes: a new rank, a new look. */
export interface Look {
  scarf: boolean;
  medal: MedalTier | null;
  cape: boolean;
  capeStars: boolean;
  crown: boolean;
  jewel: boolean;
  laurel: boolean;
  sparkles: boolean;
  glow: boolean;
}

/** What each rank adds, in the words the ladder uses: "Pip gets a cape". Pawn adds nothing. */
export const LOOK_GAINS: (string | null)[] = [
  null,
  'a scarf',
  'a bronze medal',
  'a cape',
  'a crown',
  'a jewel for the crown',
  'a silver medal',
  'stars on the cape',
  'a gold medal',
  'a laurel wreath',
  'sparkles',
  'a golden glow',
];

/** Where in RANKS a level sits, which is also the look the mascot wears. */
export function stageFor(level: number) {
  let stage = 0;
  RANKS.forEach((r, i) => {
    if (level >= r.from) stage = i;
  });
  return stage;
}

export function lookAt(stage: number): Look {
  return {
    scarf: stage >= 1,
    medal: stage >= 8 ? 'gold' : stage >= 6 ? 'silver' : stage >= 2 ? 'bronze' : null,
    cape: stage >= 3,
    capeStars: stage >= 7,
    crown: stage >= 4,
    jewel: stage >= 5,
    laurel: stage >= 9,
    sparkles: stage >= 10,
    glow: stage >= 11,
  };
}

/** The next rank and what it adds, or null at the top. */
export function nextLook(level: number) {
  const stage = stageFor(level);
  const next = RANKS[stage + 1];
  if (!next) return null;
  return { stage: stage + 1, rank: next.name, level: next.from, gain: LOOK_GAINS[stage + 1]! };
}

/** True when reaching `level` changed the look, so the level-up card can say what's new. */
export function newLookAt(level: number) {
  const stage = stageFor(level);
  return RANKS[stage].from === level && stage > 0 ? LOOK_GAINS[stage] : null;
}

/** A short friendly line for each rank, shown on the ladder. */
export const RANK_LINES: string[] = [
  'Small steps, big plans.',
  'Hopping into the action.',
  'Seeing the long diagonals.',
  'Solid as a castle wall.',
  'Go anywhere you like.',
  'The whole board answers to you.',
  'Ready for league night.',
  'Titles in sight.',
  'Your first real title.',
  'Feared at every open.',
  'The title everyone dreams of.',
  'Nobody left to beat. Keep going anyway.',
];

/* ---------- lines ---------- */

/**
 * The mascot's line for a moment, or null on the screens it stays quiet: it speaks on about every
 * other end screen, so it stays a treat. `seed` is anything stable for the screen (a count, a
 * level), so a re-render never swaps the words. A level-up always gets a line.
 */
export function mascotLine(id: MascotId, mood: Mood, seed: number) {
  const def = mascotById(id);
  if (!def) return null;
  const n = Math.abs(Math.floor(seed));
  if (mood !== 'level' && n % 2 === 1) return null;
  const lines = def.lines[mood];
  return lines[Math.floor(n / 2) % lines.length];
}

/** "Reach Rook at level 7 and Pip gets a cape." */
export function nextLookLine(name: string, level: number) {
  const next = nextLook(level);
  return next ? `Reach ${next.rank} at level ${next.level} and ${name} gets ${next.gain}.` : `${name} has every look there is.`;
}
