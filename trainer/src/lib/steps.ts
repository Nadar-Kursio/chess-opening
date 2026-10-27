import 'server-only';
import { STEP_INFO, STEP_KINDS, type StepKind } from './course';
import type { Opening } from './types';

/** Where the button at the end of a passed step goes: the chapter's next step, else the next chapter. */
export function nextAfter(op: Opening, slug: string, step: StepKind) {
  const k = STEP_KINDS.indexOf(step);
  if (k < STEP_KINDS.length - 1) {
    const kind = STEP_KINDS[k + 1];
    return { href: `/openings/${op.id}/${slug}/${kind}`, label: `Next: ${STEP_INFO[kind].label}` };
  }
  const i = op.lines.findIndex((l) => l.slug === slug);
  const following = op.lines[i + 1];
  if (following) return { href: `/openings/${op.id}/${following.slug}/learn`, label: 'Next chapter' };
  return { href: `/openings/${op.id}`, label: 'Finish course' };
}

export function shuffled<T>(items: T[]) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
