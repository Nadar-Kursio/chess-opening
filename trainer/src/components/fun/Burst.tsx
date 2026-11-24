import '@/app/fun.css';

/* Confetti in CSS alone: each piece flies out along its own angle and falls away. The spread comes
   from the index, not Math.random, so the server and the browser draw the same burst. Hidden when
   the learner asks for less motion (fun.css). */

const PIECES = 32;

export default function Burst({ big = false }: { big?: boolean }) {
  return (
    <div className={`burst${big ? ' burst--big' : ''}`} aria-hidden="true">
      {Array.from({ length: PIECES }, (_, i) => (
        <i
          key={i}
          style={
            {
              '--a': (i * 137.5) % 360,
              '--d': 0.45 + ((i * 37) % 55) / 100,
              '--t': ((i * 53) % 30) / 100,
              '--spin': i % 2 ? 1 : -1,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
