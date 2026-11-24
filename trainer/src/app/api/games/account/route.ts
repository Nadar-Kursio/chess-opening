import { revalidatePath } from 'next/cache';
import { unlink } from '@/lib/gameImport';
import { SITES } from '@/lib/gameSources';
import type { Site } from '@/lib/games';
import { getSession } from '@/lib/session';

/** Unlinks a site and forgets the games imported from it. Recall cards already due stay. */
export async function DELETE(request: Request) {
  const user = (await getSession())?.user;
  if (!user) return Response.json({ error: 'Sign in first.' }, { status: 401 });
  const site = new URL(request.url).searchParams.get('site') as Site;
  if (!SITES.includes(site)) return Response.json({ error: 'No such site.' }, { status: 400 });
  await unlink(user.id, site);
  revalidatePath('/', 'layout');
  return Response.json({ ok: true });
}
