'use server';

import { APIError } from 'better-auth/api';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { safeNextPath } from '@/lib/urls';

export type AuthResult = { error: string } | undefined;

const SignUpInput = z.object({
  name: z.string().trim().min(1, 'Tell us your name.').max(80),
  email: z.email('That doesn’t look like an email address.').trim().toLowerCase(),
  password: z.string().min(8, 'Use at least 8 characters.').max(128),
});

export async function signUp(input: z.input<typeof SignUpInput>, next: string): Promise<AuthResult> {
  const parsed = SignUpInput.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Check the form.' };
  try {
    await auth.api.signUpEmail({ body: parsed.data, headers: await headers() });
  } catch (err) {
    if (err instanceof APIError) return { error: err.message };
    throw err;
  }
  redirect(safeNextPath(next));
}

const SignInInput = z.object({
  email: z.string().trim().toLowerCase(),
  password: z.string(),
});

export async function signIn(input: z.input<typeof SignInInput>, next: string): Promise<AuthResult> {
  const { email, password } = SignInInput.parse(input);
  try {
    await auth.api.signInEmail({ body: { email, password }, headers: await headers() });
  } catch (err) {
    if (err instanceof APIError) return { error: 'That email and password don’t match an account.' };
    throw err;
  }
  redirect(safeNextPath(next));
}

export async function signOut() {
  await auth.api.signOut({ headers: await headers() });
  redirect('/sign-in');
}
