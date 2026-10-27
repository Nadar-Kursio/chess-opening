// Proxies new.chesslab.dev to the tunnel origin. The origin only answers requests carrying the
// edge secret (trainer/src/proxy.ts), so the kursio.dev hostname is not a second way in.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const target = new URL(url.pathname + url.search, env.ORIGIN);
    const headers = new Headers(request.headers);
    // Next compares a Server Action's Origin with the forwarded host, and the app builds its
    // redirects from it.
    headers.set('x-forwarded-host', url.host);
    headers.set('x-forwarded-proto', 'https');
    headers.set('x-chesslab-edge', env.EDGE_SECRET);
    const response = await fetch(target, {
      method: request.method,
      headers,
      body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
      redirect: 'manual',
    });
    const location = response.headers.get('location');
    if (!location) return response;
    const out = new Response(response.body, response);
    out.headers.set('location', location.replace(env.ORIGIN, `${url.protocol}//${url.host}`));
    return out;
  },
};
