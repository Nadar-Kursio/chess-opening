'use server';

import { takeNews } from '@/lib/fun';
import { requireUser } from '@/lib/session';

/** Badges, quests and level-ups the learner hasn't been shown, each handed out once. */
export async function claimNews() {
  const user = await requireUser();
  return (await takeNews(user.id)).news;
}
