import 'server-only';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { auth } from './auth';

/** One lookup per request, however many layouts, pages and loaders ask. */
export const getSession = cache(async () => auth.api.getSession({ headers: await headers() }));

/** For Server Actions: every write is the signed-in learner's own. */
export async function requireUser() {
  const session = await getSession();
  if (!session) throw new Error('Sign in to do that.');
  return session.user;
}

/** Every page needs an account; sends the visitor to sign in and back. */
export async function requirePageUser(path: string) {
  const session = await getSession();
  if (!session) redirect(`/sign-in?next=${encodeURIComponent(path)}`);
  return session.user;
}
