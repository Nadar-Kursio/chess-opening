import 'server-only';
import { cache } from 'react';
import { query, queryOne } from './db';
import { isMascotId, type MascotId } from './mascots';

/** The learner's companion, or null before they pick one. */
export const getMascot = cache(async (userId: string): Promise<MascotId | null> => {
  const row = await queryOne<{ mascot: string }>(`select mascot from mascot_choices where user_id = $1`, [userId]);
  return isMascotId(row?.mascot) ? row.mascot : null;
});

export async function setMascot(userId: string, mascot: MascotId) {
  await query(
    `insert into mascot_choices (user_id, mascot) values ($1, $2)
     on conflict (user_id) do update set mascot = excluded.mascot, chosen_at = now()`,
    [userId, mascot],
  );
}
