import { z } from 'zod';

/* What the browser's outbox (outbox.ts) posts to /api/saves: a finished session, or one Recall
   answer. `id` makes a repeat harmless and `at` is when it was played, so a run that syncs
   tomorrow still counts for today's streak. */

const Count = z.number().int().min(0).max(10_000);
// A position key is the 64-square board plus the side to move.
const PositionKey = z.string().regex(/^[.pnbrqkPNBRQK]{64}[wb]$/);

const SessionSave = z.object({
  openingId: z.string().max(64),
  lineSlug: z.string().max(120).nullable(),
  mode: z.enum(['learn', 'drill', 'recall', 'quiz', 'free', 'review']),
  correct: Count,
  wrong: Count,
  hints: Count,
  score: z.number().int().min(0).max(100).nullable(),
  positions: z.array(z.object({ key: PositionKey, hit: z.boolean() })).max(400),
});

const GradeSave = z.object({
  openingId: z.string().max(64),
  key: PositionKey,
  hit: z.boolean(),
  ms: z.number().int().min(0).max(3_600_000),
});

const Envelope = { id: z.uuid(), at: z.number().int() };

export const Save = z.discriminatedUnion('kind', [
  z.object({ ...Envelope, kind: z.literal('session'), session: SessionSave }),
  z.object({ ...Envelope, kind: z.literal('grade'), grade: GradeSave }),
]);

export type Save = z.infer<typeof Save>;
export type SessionSave = z.infer<typeof SessionSave>;
export type GradeSave = z.infer<typeof GradeSave>;
