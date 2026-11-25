/* The six crown levels by name, apart from the rules in crowns.ts so the browser can name a level
   without bundling the scheduler. */

export type CrownLevel = 0 | 1 | 2 | 3 | 4 | 5;
export const MAX_CROWN = 5;

export const CROWN_NAME: Record<CrownLevel, string> = {
  0: 'New',
  1: 'Learned',
  2: 'Practised',
  3: 'Solid',
  4: 'Strong',
  5: 'Mastered',
};

/** What each level asks of a chapter: the explainer's ladder. */
export const CROWN_RULE: Record<CrownLevel, string> = {
  0: 'Not learned yet',
  1: 'You finished its Learn step',
  2: 'Every move answered once',
  3: 'Every move remembered for a week',
  4: 'Half the moves in long-term memory',
  5: 'Every move in long-term memory',
};
