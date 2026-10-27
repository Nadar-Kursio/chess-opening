import { redirect } from 'next/navigation';
import AuthCard from '@/components/auth/AuthCard';
import AuthForm from '@/components/auth/AuthForm';
import { getSession } from '@/lib/session';
import { safeNextPath } from '@/lib/urls';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Create an account' };

export default async function SignUpPage({ searchParams }: PageProps<'/sign-up'>) {
  const next = safeNextPath((await searchParams).next);
  if (await getSession()) redirect(next);
  return (
    <AuthCard title="Create your account" lead="Your progress, streak and mistakes are saved to it, on every device.">
      <AuthForm kind="sign-up" next={next} />
    </AuthCard>
  );
}
