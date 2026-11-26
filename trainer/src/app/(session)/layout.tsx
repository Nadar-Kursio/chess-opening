import OutboxSync from '@/components/OutboxSync';
import FunNews from '@/components/fun/FunNews';
import SessionMascot from '@/components/mascot/SessionMascot';
import { getSession } from '@/lib/session';

export default async function SessionLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  return (
    <>
      {children}
      {session ? <OutboxSync userId={session.user.id} /> : null}
      {session ? <FunNews /> : null}
      {session ? <SessionMascot userId={session.user.id} /> : null}
    </>
  );
}
