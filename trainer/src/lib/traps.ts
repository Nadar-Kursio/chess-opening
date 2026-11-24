import { STEP_INFO, chapters, courseProgress, lineBySlug, type CourseProgress, type LineProgress } from './course.ts';
import type { CourseTrap, Opening } from './types.ts';

/* A trap course as a repertoire course shows it. Which traps belong where is the build's job
   (relate_traps in src/build.py); this only decides what the learner sees and where each link goes.
   Pure, so tests/traps.test.ts drives it against the real compiled course. */

/** "London: the Poisoned b2-Pawn" reads as "the Poisoned b2-Pawn" inside a course that is already the London. */
export function trapName(name: string) {
  const short = name.includes(': ') ? name.slice(name.indexOf(': ') + 2) : name;
  return short.replace(/^The /, 'the ');
}

export const trapTitle = (name: string) => {
  const short = trapName(name);
  return short[0].toUpperCase() + short.slice(1);
};

export function trapChip(trap: Pick<CourseTrap, 'name' | 'group'>) {
  return `${trap.group === 'set' ? 'Trap' : 'Watch for'}: ${trapName(trap.name)}`;
}

interface Link {
  href: string;
  label: string;
}

export interface TrapView {
  trap: CourseTrap;
  title: string;
  /** The trap course's own progress, which never counts toward this course's. */
  progress: CourseProgress;
  primary: Link;
  secondary: Link;
  /** What to play instead, for a trap to watch for: the course's own sideline when it has one. */
  defence?: { name: string; text: string; studied: boolean };
}

export function trapView(
  course: Opening,
  trap: CourseTrap,
  trapOp: Opening,
  trapProgress: Map<string, LineProgress>,
  courseByLine: Map<string, LineProgress>,
): TrapView {
  const progress = courseProgress(chapters(trapOp), trapProgress);
  const page = `/openings/${trap.id}`;
  const base = { trap, title: trapTitle(trap.name), progress };

  if (trap.group === 'set') {
    const next = progress.next;
    return {
      ...base,
      primary: next
        ? {
            href: `${page}/${next.slug}/${next.step}`,
            label: progress.done ? `Continue: ${STEP_INFO[next.step].label}` : 'Learn to set it',
          }
        : { href: page, label: 'Practise it again' },
      secondary: { href: page, label: 'Open the trap course' },
    };
  }

  const other = { href: page, label: 'See it from the other side' };
  const row = course.sidelines?.items.find((s) => s.slug === trap.sideline);
  if (row) {
    const studied = !!courseByLine.get(row.slug)?.learned_at;
    return {
      ...base,
      defence: { name: `Your answer to ${row.num}`, text: row.short, studied },
      primary: {
        href: `/openings/${course.id}/${row.slug}/${studied ? 'drill' : 'learn'}`,
        label: studied ? 'Drill your answer' : 'Learn your answer',
      },
      secondary: other,
    };
  }
  const line = trap.learn ? lineBySlug(trapOp, trap.learn) : null;
  if (line) {
    const studied = !!trapProgress.get(line.slug)?.learned_at;
    return {
      ...base,
      defence: { name: line.name, text: line.note, studied },
      primary: {
        href: `${page}/${line.slug}/${studied ? 'drill' : 'learn'}`,
        label: studied ? 'Drill the dodge' : 'Learn the dodge',
      },
      secondary: other,
    };
  }
  return { ...base, primary: { href: page, label: 'Open the trap course' }, secondary: other };
}
