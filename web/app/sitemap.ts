import type { MetadataRoute } from "next";
import { getCatalog } from "@/lib/content/load";

export const dynamic = "force-static";

const BASE = "https://chesslab.dev";

export default function sitemap(): MetadataRoute.Sitemap {
  const catalog = getCatalog();
  return [
    { url: `${BASE}/` },
    { url: `${BASE}/openings/` },
    ...catalog.openings.flatMap((o) => [
      { url: `${BASE}/openings/${o.id}/` },
      ...o.lines.slice(1).map((l) => ({ url: `${BASE}/openings/${o.id}/${l.slug}/` })),
    ]),
  ];
}
