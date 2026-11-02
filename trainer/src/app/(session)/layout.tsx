import OutboxSync from '@/components/OutboxSync';
import { getSession } from '@/lib/session';

export default async function SessionLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  return (
    <>
      {children}
      {session ? <OutboxSync userId={session.user.id} /> : null}
    </>
  );
}
