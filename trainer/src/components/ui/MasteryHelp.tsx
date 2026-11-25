import { CROWN_NAME, CROWN_RULE, MAX_CROWN, type CrownLevel } from '@/lib/crownLevels';
import Crown from './Crown';

/* "How mastery works": one popover per page, opened by any MasteryHelpButton. The browser's popover
   handles opening, Escape and tapping outside, so it needs no script. */

const ID = 'mastery-help';
const LEVELS = Array.from({ length: MAX_CROWN + 1 }, (_, i) => i as CrownLevel);

export function MasteryHelpButton({ className, label, children }: { className: string; label?: string; children: React.ReactNode }) {
  return (
    <button type="button" popoverTarget={ID} className={className} aria-label={label}>
      {children}
    </button>
  );
}

export default function MasteryHelp() {
  return (
    <div id={ID} popover="auto" className="mastery-help" role="dialog" aria-labelledby={`${ID}-title`}>
      <h2 id={`${ID}-title`}>How mastery works</h2>
      <p>
        Each chapter&rsquo;s crown climbs as Recall finds its moves settling into long-term memory, and fades when reviews are left
        overdue.
      </p>
      <ol className="mastery-help__ladder">
        {LEVELS.map((l) => (
          <li key={l}>
            <Crown level={l} size="sm" />
            <b className={`crown-name crown-name--l${l}`}>{CROWN_NAME[l]}</b>
            <span>{CROWN_RULE[l]}</span>
          </li>
        ))}
        <li className="mastery-help__fading">
          <Crown level={3} fading size="sm" />
          <b>Fading</b>
          <span>Overdue moves cost a level, and another each week they wait. Review them to win it back.</span>
        </li>
      </ol>
      <p className="muted small">
        Long-term memory means Recall waits three weeks or more to ask again. A move several chapters share fades only the first you
        learned.
      </p>
      <button type="button" popoverTarget={ID} popoverTargetAction="hide" className="btn btn--primary btn--block">
        Got it
      </button>
    </div>
  );
}
