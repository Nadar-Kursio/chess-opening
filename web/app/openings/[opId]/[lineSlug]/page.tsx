import type { Metadata } from "next";
import { getCatalog, getOpening } from "@/lib/content/load";
import OpeningView from "@/components/opening/OpeningView";

export function generateStaticParams() {
  return getCatalog().openings.flatMap((o) =>
    o.lines.slice(1).map((l) => ({ opId: o.id, lineSlug: l.slug }))
  );
}

export const dynamicParams = false;

export async function generateMetadata(
  { params }: { params: Promise<{ opId: string; lineSlug: string }> }
): Promise<Metadata> {
  const { opId, lineSlug } = await params;
  const op = getOpening(opId);
  const line = op.lines.find((l) => l.slug === lineSlug)!;
  return {
    title: `${op.name} — ${line.name}`,
    description: line.note,
  };
}

export default async function LinePage(
  { params }: { params: Promise<{ opId: string; lineSlug: string }> }
) {
  const { opId, lineSlug } = await params;
  const op = getOpening(opId);
  const lineIndex = op.lines.findIndex((l) => l.slug === lineSlug);
  return <OpeningView opening={op} lineIndex={lineIndex} catalog={getCatalog()} />;
}
