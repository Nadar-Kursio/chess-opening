'use server';

import { revalidatePath } from 'next/cache';
import { setMascot } from '@/lib/mascotChoice';
import { isMascotId } from '@/lib/mascots';
import { requireUser } from '@/lib/session';

/** Stores the learner's companion so it follows the account to every device. */
export async function chooseMascot(id: string) {
  const user = await requireUser();
  if (!isMascotId(id)) throw new Error('Unknown companion.');
  await setMascot(user.id, id);
  revalidatePath('/', 'layout');
}
