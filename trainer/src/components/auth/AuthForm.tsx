'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { signIn, signUp } from '@/app/auth-actions';

export default function AuthForm({ kind, next }: { kind: 'sign-in' | 'sign-up'; next: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const submit = (form: FormData) => {
    setError(null);
    start(async () => {
      const values = {
        name: String(form.get('name') ?? ''),
        email: String(form.get('email') ?? ''),
        password: String(form.get('password') ?? ''),
      };
      const result = kind === 'sign-up' ? await signUp(values, next) : await signIn(values, next);
      if (result?.error) setError(result.error);
    });
  };
  const other = kind === 'sign-in' ? '/sign-up' : '/sign-in';
  const query = next !== '/' ? `?next=${encodeURIComponent(next)}` : '';
  return (
    <form action={submit} className="form">
      {kind === 'sign-up' ? (
        <label className="field">
          <span>Name</span>
          <input name="name" autoComplete="name" required maxLength={80} />
        </label>
      ) : null}
      <label className="field">
        <span>Email</span>
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label className="field">
        <span>Password</span>
        <input
          name="password"
          type="password"
          autoComplete={kind === 'sign-up' ? 'new-password' : 'current-password'}
          minLength={kind === 'sign-up' ? 8 : undefined}
          required
        />
      </label>
      {error ? (
        <p className="form__error" role="alert">
          {error}
        </p>
      ) : null}
      <button className="btn btn--primary btn--lg btn--block" type="submit" disabled={pending}>
        {pending ? 'One moment…' : kind === 'sign-up' ? 'Create account' : 'Sign in'}
      </button>
      <p className="muted small form__switch">
        {kind === 'sign-in' ? 'New here?' : 'Already have an account?'}{' '}
        <Link href={`${other}${query}`}>{kind === 'sign-in' ? 'Create an account' : 'Sign in'}</Link>
      </p>
    </form>
  );
}
