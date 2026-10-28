import { notFound } from 'next/navigation';
import GameSession from '@/components/session/GameSession';
import { getGame, getOpening, hasOpening } from '@/lib/content';
import { turnOf } from '@/lib/course';
import { getSettings } from '@/lib/progress';
import { requirePageUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

type Params = PageProps<'/openings/[id]/games/[game]'>;

export async function generateMetadata({ params }: Params) {
  const { game } = await params;
  return { title: getGame(game)?.name.split(' — ')[0] ?? 'Model game' };
}

export default async function GamePage({ params }: Params) {
  const { id, game: gameId } = await params;
  const game = hasOpening(id) ? getGame(gameId) : null;
  if (!game || game.op !== id) notFound();
  const user = await requirePageUser(`/openings/${id}/games/${gameId}`);
  const settings = await getSettings(user.id);
  return (
    <GameSession
      openingId={id}
      game={game}
      side={turnOf(getOpening(id).orientation)}
      closeHref={`/openings/${id}`}
      sound={settings.sound}
      coordinates={settings.coordinates}
    />
  );
}
