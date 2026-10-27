import { redirect } from 'next/navigation';
import AuthCard from '@/components/auth/AuthCard';
import AuthForm from '@/components/auth/AuthForm';
import { getSession } from '@/lib/session';
import { safeNextPath } from '@/lib/urls';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Sign in' };

export default async function SignInPage({ searchParams }: PageProps<'/sign-in'>) {
  const next = safeNextPath((await searchParams).next);
  if (await getSession()) redirect(next);
  return (
    <AuthCard title="Welcome back" lead="Sign in to pick up your openings where you left them.">
      <AuthForm kind="sign-in" next={next} />
    </AuthCard>
  );
}
