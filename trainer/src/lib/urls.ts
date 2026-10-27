/** Only same-site paths, so a crafted ?next= can't bounce a fresh session to another origin. */
export function safeNextPath(next: unknown) {
  if (typeof next !== 'string' || !next.startsWith('/') || next.startsWith('//')) return '/';
  if (next.startsWith('/\\')) return '/';
  return next;
}
