import Link from 'next/link';
import { getFun } from '@/lib/fun';
import { XP } from '@/lib/xp';
import '@/app/fun.css';

/** Today's three quests. `wide` lays them side by side, for a strip across Home. */
export default async function QuestCard({ userId, wide = false }: { userId: string; wide?: boolean }) {
  const { quests, questsDone } = await getFun(userId);
  const done = quests.filter((q) => q.done).length;
  return (
    <section className={`card quests${wide ? ' quests--wide' : ''}${questsDone ? ' quests--done' : ''}`} aria-labelledby="quests-title">
      <div className="quests__head">
        <h3 id="quests-title">Daily quests</h3>
        <span className="quests__count">{done}/3</span>
      </div>
      <ul className="quests__list">
        {quests.map((q) => (
          <li key={q.id}>
            <Link
              href={q.href}
              className={`quest${q.done ? ' quest--done' : ''}`}
              aria-label={`${q.title}: ${q.done ? 'done' : `${q.value} of ${q.goal}`}`}
            >
              <span className="quest__check" aria-hidden="true">
                {q.done ? (
                  <svg viewBox="0 0 24 24" width="16" height="16">
                    <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : null}
              </span>
              <span className="quest__body">
                <span className="quest__title">{q.title}</span>
                <span className="quest__bar" aria-hidden="true">
                  <span style={{ width: `${Math.max(q.done ? 100 : 4, q.share * 100)}%` }} />
                </span>
              </span>
              <span className="quest__n">{q.done ? `+${XP.quest} XP` : `${q.value}/${q.goal}`}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="quests__foot">
        {questsDone ? `All three cleared: +${XP.questDay} XP bonus. New quests tomorrow.` : `Clear all three for a ${XP.questDay} XP bonus.`}
      </p>
    </section>
  );
}
