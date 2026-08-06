import type { Metadata } from "next";
import { getCatalog, getOpening } from "@/lib/content/load";
import OpeningView from "@/components/opening/OpeningView";

/* The opening's own URL shows its main line; further variations are pages of
   their own under [lineSlug]. Line 0 deliberately has no slug URL — one
   canonical page per position in the course, no duplicate content. */

export function generateStaticParams() {
  return getCatalog().openings.map((o) => ({ opId: o.id }));
}

export const dynamicParams = false;

export async function generateMetadata(
  { params }: { params: Promise<{ opId: string }> }
): Promise<Metadata> {
  const { opId } = await params;
  const op = getOpening(opId);
  return {
    title: `${op.name} (${op.eco})`,
    description: op.tagline,
  };
}

export default async function OpeningPage(
  { params }: { params: Promise<{ opId: string }> }
) {
  const { opId } = await params;
  return <OpeningView opening={getOpening(opId)} lineIndex={0} catalog={getCatalog()} />;
}
