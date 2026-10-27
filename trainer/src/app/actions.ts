'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getOpening, hasOpening } from '@/lib/content';
import { lineBySlug } from '@/lib/course';
import { recordSession, resetOpening, saveSettings } from '@/lib/progress';
import { requireUser } from '@/lib/session';

const Count = z.number().int().min(0).max(10_000);

const SessionInput = z.object({
  openingId: z.string().max(64),
  lineSlug: z.string().max(120).nullable(),
  mode: z.enum(['learn', 'drill', 'recall', 'quiz', 'free', 'review']),
  correct: Count,
  wrong: Count,
  hints: Count,
  score: z.number().int().min(0).max(100).nullable(),
  // A position key is the 64-square board plus the side to move.
  positions: z
    .array(z.object({ key: z.string().regex(/^[.pnbrqkPNBRQK]{64}[wb]$/), hit: z.boolean() }))
    .max(400),
});

export async function finishSession(input: z.input<typeof SessionInput>) {
  const user = await requireUser();
  const r = SessionInput.parse(input);
  if (!hasOpening(r.openingId)) throw new Error('No such opening.');
  if (r.lineSlug && !lineBySlug(getOpening(r.openingId), r.lineSlug)) {
    throw new Error('No such chapter.');
  }
  const result = await recordSession(user.id, r);
  revalidatePath('/', 'layout');
  return result;
}

const SettingsInput = z.object({
  daily_goal: z.number().int().min(5).max(500),
  sound: z.boolean(),
  coordinates: z.boolean(),
});

export async function updateSettings(input: z.input<typeof SettingsInput>) {
  const user = await requireUser();
  await saveSettings(user.id, SettingsInput.parse(input));
  revalidatePath('/', 'layout');
}

export async function resetCourse(openingId: string) {
  const user = await requireUser();
  if (!hasOpening(openingId)) throw new Error('No such opening.');
  await resetOpening(user.id, openingId);
  revalidatePath('/', 'layout');
}
