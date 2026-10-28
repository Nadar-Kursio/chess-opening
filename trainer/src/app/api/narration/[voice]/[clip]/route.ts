import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { NextRequest } from 'next/server';
import { CLIP, NARRATION_DIR } from '@/lib/narration';
import { getSession } from '@/lib/session';
import { isVoice } from '@/lib/speech';

/* A recorded clip. Names are content hashes, so a clip never changes and can be cached for good.
   Safari only plays audio from a server that answers byte ranges, hence the 206. */
export async function GET(request: NextRequest, ctx: RouteContext<'/api/narration/[voice]/[clip]'>) {
  const { voice, clip } = await ctx.params;
  if (!isVoice(voice) || !CLIP.test(clip)) return new Response('Not found', { status: 404 });
  if (!(await getSession())) return new Response('Sign in', { status: 401 });
  let body: Buffer;
  try {
    body = await readFile(path.join(NARRATION_DIR, voice, clip));
  } catch {
    return new Response('Not found', { status: 404 });
  }
  const headers = {
    'content-type': 'audio/mpeg',
    'accept-ranges': 'bytes',
    'cache-control': 'private, max-age=31536000, immutable',
  };
  const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get('range') ?? '');
  if (range && (range[1] || range[2])) {
    const start = range[1] ? Number(range[1]) : Math.max(0, body.length - Number(range[2]));
    const end = range[1] && range[2] ? Math.min(Number(range[2]), body.length - 1) : body.length - 1;
    if (start > end) return new Response(null, { status: 416, headers: { 'content-range': `bytes */${body.length}` } });
    return new Response(new Uint8Array(body.subarray(start, end + 1)), {
      status: 206,
      headers: { ...headers, 'content-range': `bytes ${start}-${end}/${body.length}`, 'content-length': String(end - start + 1) },
    });
  }
  return new Response(new Uint8Array(body), { headers: { ...headers, 'content-length': String(body.length) } });
}
