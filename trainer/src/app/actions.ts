'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { hasOpening } from '@/lib/content';
import { resetOpening, saveNarration, saveSettings } from '@/lib/progress';
import { requireUser } from '@/lib/session';
import { SOUND_SETS } from '@/lib/sound';
import { SPEECH_RATES, VOICES, type Voice } from '@/lib/speech';

const SettingsInput = z.object({
  daily_goal: z.number().int().min(5).max(500),
  sound: z.enum(SOUND_SETS),
  coordinates: z.boolean(),
  narration: z.boolean(),
  voice: z.enum(Object.keys(VOICES) as [Voice, ...Voice[]]),
  speech_rate: z.union(SPEECH_RATES.map((r) => z.literal(r))),
});

export async function updateSettings(input: z.input<typeof SettingsInput>) {
  const user = await requireUser();
  await saveSettings(user.id, SettingsInput.parse(input));
  revalidatePath('/', 'layout');
}

export async function setNarration(on: boolean) {
  const user = await requireUser();
  await saveNarration(user.id, z.boolean().parse(on));
}

export async function resetCourse(openingId: string) {
  const user = await requireUser();
  if (!hasOpening(openingId)) throw new Error('No such opening.');
  await resetOpening(user.id, openingId);
  revalidatePath('/', 'layout');
}
