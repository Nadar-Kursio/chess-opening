import type { NextConfig } from "next";

// Static export, deliberately: the site is data compiled ahead of time by
// src/build.py, and a server would have nothing to do. Flipping this off (plus
// a Cloudflare adapter) is the escape hatch if accounts/sync ever arrive.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
