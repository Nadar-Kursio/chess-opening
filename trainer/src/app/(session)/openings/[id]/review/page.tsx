import { redirect } from 'next/navigation';

/** Missed positions are Recall cards now: a miss is due again tomorrow. */
export default async function ReviewPage({ params }: PageProps<'/openings/[id]/review'>) {
  const { id } = await params;
  redirect(`/recall/session?course=${encodeURIComponent(id)}`);
}
