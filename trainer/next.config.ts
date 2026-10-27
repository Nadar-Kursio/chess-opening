import type { NextConfig } from 'next';

// A server, unlike web/: accounts and progress live in Postgres. The course data is still the
// JSON src/build.py emits, read from CONTENT_DIR at runtime (scripts/content.sh puts it there).
const nextConfig: NextConfig = {
  distDir: process.env.NEXT_BUILD_DIR ?? '.next',
  poweredByHeader: false,
  // The edge Worker forwards new.chesslab.dev to the tunnel origin; Server Actions posted from
  // the public origin must be accepted there.
  experimental: { serverActions: { allowedOrigins: ['new.chesslab.dev'] } },
};

export default nextConfig;
