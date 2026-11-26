import type { Colour, Line } from './types';

/* What the coach says aloud in Learn. Course prose is written for the eye — "2.Bf4", "...Nbd7",
   "the b8–h2 diagonal" — so it is turned into words a voice reads naturally before it is recorded.
   Shared by the recording script and the server: both must produce the same text, because a clip
   is named by a hash of it. The browser only takes the voice list and speeds, for Settings. */

export const VOICES = {
  brian: { polly: 'Brian', name: 'Brian', accent: 'British' },
  amy: { polly: 'Amy', name: 'Amy', accent: 'British' },
  matthew: { polly: 'Matthew', name: 'Matthew', accent: 'American' },
} as const;

export type Voice = keyof typeof VOICES;

export const isVoice = (v: string): v is Voice => Object.hasOwn(VOICES, v);

/** Every course gets Brian; the voice a learner hears when theirs wasn't recorded. */
export const DEFAULT_VOICE: Voice = 'brian';

/** The courses read aloud, each with the voices it is recorded in. The first four were recorded in
    all three; a new course is recorded once, in Brian's voice, because every voice costs the same
    again and each course has its own budget (scripts/narrate.ts). */
export const NARRATED: Record<string, readonly Voice[]> = {
  london: ['brian', 'amy', 'matthew'],
  scandinavian: ['brian', 'amy', 'matthew'],
  sicilian: ['brian', 'amy', 'matthew'],
  queensgambit: ['brian', 'amy', 'matthew'],
};

/** The voices to try for a course, best first: the learner's own if the course has it, then Brian. */
export function voicesFor(courseId: string, chosen: Voice): Voice[] {
  const recorded = NARRATED[courseId] ?? [];
  return [chosen, DEFAULT_VOICE, ...recorded].filter((v, i, all) => recorded.includes(v) && all.indexOf(v) === i);
}

/** The narrated courses only Brian reads. */
export function brianOnly(): string[] {
  return Object.entries(NARRATED)
    .filter(([, voices]) => voices.length === 1 && voices[0] === DEFAULT_VOICE)
    .map(([id]) => id);
}

/** The line under the voice picker naming those courses, by their titles; null when there are none. */
export function brianOnlyNote(names: string[]) {
  if (!names.length) return null;
  const list = names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
  return `Brian reads ${list} on his own, so you’ll hear him there whichever voice you pick.`;
}

/** Speaking speeds offered in Settings, in percent. */
export const SPEECH_RATES = [90, 100, 125, 150] as const;

/** Played when a voice is picked in Settings. */
export const SAMPLE = 'Hi, I’m your coach. I’ll explain every move as you play it.';

const PIECE: Record<string, string> = { K: 'king', Q: 'queen', R: 'rook', B: 'bishop', N: 'knight' };

/* A move as the course prints it: an optional move number ("12." or "12..." or a bare "..."), then
   castling, a piece move, a pawn capture or a pawn move, an optional "–d5" continuation for a
   manoeuvre, a check sign and any !/? marks. A bare square ("the d5 square") matches the last
   alternative and is read as itself. */
const MOVE =
  /(?:\b\d+\.(?:\.\.)?\s?|\.\.\.)?\b(O-O-O|O-O|([KQRBN])([a-h]?[1-8]?)(x?)([a-h][1-8])|([a-h])x([a-h][1-8])(?:=([QRBN]))?|([a-h][1-8])(?:=([QRBN]))?)(?:–([a-h][1-8]))?([+#])?[!?]*/g;

function moveWords(m: RegExpExecArray | string[]) {
  const [, whole, piece, from, takes, pieceTo, pawnFile, pawnTo, capPromo, square, promo, onTo, check] = m;
  let words: string;
  if (whole === 'O-O') words = 'castles';
  else if (whole === 'O-O-O') words = 'castles queenside';
  else if (piece)
    words = [PIECE[piece], from ? from.split('').join(' ') : '', takes ? 'takes' : '', pieceTo].filter(Boolean).join(' ');
  else if (pawnFile) words = `${pawnFile} takes ${pawnTo}`;
  else words = square;
  const promotion = capPromo ?? promo;
  if (promotion) words += `, promoting to a ${PIECE[promotion]}`;
  if (onTo) words += ` to ${onTo}`;
  if (check) words += check === '#' ? ', checkmate' : ', check';
  return words;
}

/** Course prose (or a single SAN move) as words to be read aloud. */
export function spoken(text: string) {
  return text
    .replace(/<\/(p|li)>/g, '. ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&[lr]squo;|&#39;/g, '’')
    .replace(/&quot;|&[lr]dquo;/g, '"')
    .replace(/\bvs\.?(?=\s)/g, 'versus')
    .replace(/\b([a-h][1-8])-(?=[a-z])/g, '$1 ')
    .replace(/\b([a-h][1-8])–([a-h][1-8])\b/g, '$1 to $2')
    .replace(MOVE, (...m) => moveWords(m as string[]))
    .replace(/\s+([.,;:])/g, '$1')
    .replace(/\.(\s*\.)+/g, '.')
    .replace(/\s+/g, ' ')
    .trim();
}

const sentence = (s: string) => (/[.!?:]$/.test(s) ? s : `${s}.`);

export interface Utterance {
  /** "intro", "plan", or "p<ply index>". */
  key: string;
  text: string;
}

/** Everything the coach reads in a Learn session of this line, in the order it is read. */
export function utterances(line: Line, side: Colour): Utterance[] {
  const out: Utterance[] = [{ key: 'intro', text: spoken(`${sentence(line.name)} ${line.note}`) }];
  const you = side === 'white' ? 'w' : 'b';
  line.plies.forEach((p, i) => {
    if (i === 0) return;
    const move = spoken(p.san);
    const lead = p.turn === you ? `Your move: ${move}.` : `${p.turn === 'w' ? 'White' : 'Black'} plays ${move}.`;
    out.push({ key: `p${i}`, text: p.note ? `${lead} ${spoken(p.note)}` : lead });
  });
  const plan = line.plan;
  if (plan) {
    const parts = ['Where this leaves you.', sentence(spoken(plan.point))];
    for (const n of plan.next ?? []) parts.push(sentence(spoken(n)));
    if (plan.endgame) parts.push(`If the queens come off: ${sentence(spoken(plan.endgame))}`);
    out.push({ key: 'plan', text: parts.join(' ') });
  }
  return out;
}
