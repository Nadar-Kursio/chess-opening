import { lookAt, mascotById, type Look, type MascotId, type MedalTier } from '@/lib/mascots';
import '@/app/mascot.css';

/* The six companions, drawn in a 120-unit box standing on y = 112, with what their rank lets them
   wear layered around them. Colours come from classes in mascot.css, so a theme or a locked
   preview restyles every part at once. No hooks, so a server page and a client card draw the same. */

export type MascotSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type Face = 'idle' | 'happy' | 'cheer';
export type Motion = 'hop' | 'sway' | null;

interface Anchors {
  /** Centre and width of the scarf. */
  neck: { x: number; y: number; w: number };
  chest: { x: number; y: number };
  /** Centre of the crown's base, and its width. */
  head: { x: number; y: number; w: number };
  /** Where the cape hangs from. */
  shoulders: { x1: number; x2: number; y: number };
}

interface FaceSpec {
  cx: number;
  cy: number;
  /** Half the distance between the eyes. */
  dx: number;
  r: number;
  mouth: number | null;
  brows?: 'brave' | 'calm';
  lashes?: boolean;
}

const BASE = 'M28 112 Q28 100 40 98 L80 98 Q92 100 92 112 Z';

function pedestal(top: number) {
  return `M41 100 Q43 ${top + 6} 49 ${top} L71 ${top} Q77 ${top + 6} 79 100 Z`;
}

const CAST: Record<MascotId, { anchors: Anchors; face: FaceSpec; body: React.ReactNode }> = {
  pip: {
    anchors: {
      neck: { x: 60, y: 74, w: 42 },
      chest: { x: 60, y: 89 },
      head: { x: 60, y: 22, w: 30 },
      shoulders: { x1: 42, x2: 78, y: 74 },
    },
    face: { cx: 60, cy: 46, dx: 10, r: 4.6, mouth: 57, brows: 'brave' },
    body: (
      <>
        <path className="m-b" d={BASE} />
        <path className="m-b" d={pedestal(74)} />
        <ellipse className="m-s" cx="60" cy="74" rx="21" ry="6" />
        <circle className="m-b" cx="60" cy="46" r="27" />
        <path className="m-l m-flat" d="M44 34 Q50 24 60 23" />
        <path className="m-tuft" d="M58 20 Q60 10 69 12" />
      </>
    ),
  },
  jinx: {
    anchors: {
      neck: { x: 60, y: 82, w: 38 },
      chest: { x: 60, y: 93 },
      head: { x: 60, y: 19, w: 26 },
      shoulders: { x1: 44, x2: 76, y: 82 },
    },
    face: { cx: 60, cy: 44, dx: 12, r: 4.4, mouth: 75 },
    body: (
      <>
        <path className="m-b" d={BASE} />
        <path className="m-b" d={pedestal(80)} />
        <path className="m-s" d="M62 17 Q82 11 89 27 Q99 31 93 41 Q101 48 93 56 Q99 65 90 70 Q92 79 79 81 Z" />
        <path className="m-b" d="M45 31 Q34 17 40 3 Q53 12 54 25 Z" />
        <path className="m-b" d="M75 31 Q86 17 80 3 Q67 12 66 25 Z" />
        <path className="m-s m-flat" d="M46 25 Q40 16 42 10 Q49 15 50 22 Z" />
        <path className="m-s m-flat" d="M74 25 Q80 16 78 10 Q71 15 70 22 Z" />
        <path className="m-b" d="M60 18 C82 18 88 36 86 52 C84 66 78 83 60 83 C42 83 36 66 34 52 C32 36 38 18 60 18 Z" />
        <ellipse className="m-l" cx="60" cy="69" rx="18" ry="12.5" />
        <ellipse className="m-ink" cx="53.5" cy="67" rx="2.4" ry="3" />
        <ellipse className="m-ink" cx="66.5" cy="67" rx="2.4" ry="3" />
        <path className="m-s" d="M45 26 Q47 8 60 15 Q66 4 76 17 Q72 23 64 22 Q56 30 45 26 Z" />
      </>
    ),
  },
  hoot: {
    anchors: {
      neck: { x: 60, y: 71, w: 50 },
      chest: { x: 60, y: 86 },
      head: { x: 60, y: 26, w: 28 },
      shoulders: { x1: 40, x2: 80, y: 60 },
    },
    face: { cx: 60, cy: 47, dx: 12, r: 4.4, mouth: null },
    body: (
      <>
        <path className="m-b" d={BASE} />
        <path className="m-s" d="M41 36 L34 11 L53 27 Z" />
        <path className="m-s" d="M79 36 L86 11 L67 27 Z" />
        <circle className="m-b" cx="60" cy="13" r="5" />
        <path className="m-b" d="M60 17 C83 30 90 58 87 80 C85 95 76 101 60 101 C44 101 35 95 33 80 C30 58 37 30 60 17 Z" />
        <path className="m-s" d="M36 58 Q22 78 39 95 Q43 76 36 58 Z" />
        <path className="m-s" d="M84 58 Q98 78 81 95 Q77 76 84 58 Z" />
        <ellipse className="m-l" cx="60" cy="83" rx="17" ry="15" />
        <path className="m-feather m-detail" d="M51 80 l4.5 4 l4.5 -4 l4.5 4 l4.5 -4 M55 89 l5 4 l5 -4" />
        <circle className="m-eye" cx="48" cy="47" r="11" />
        <circle className="m-eye" cx="72" cy="47" r="11" />
        <path className="m-glasses" d="M59 46 Q60 43 61 46" />
        <path className="m-beak" d="M55.5 58 L64.5 58 L60 66.5 Z" />
      </>
    ),
  },
  brick: {
    anchors: {
      neck: { x: 60, y: 80, w: 56 },
      chest: { x: 60, y: 92 },
      head: { x: 60, y: 17, w: 26 },
      shoulders: { x1: 38, x2: 82, y: 40 },
    },
    face: { cx: 60, cy: 56, dx: 12, r: 4.4, mouth: 68, brows: 'calm' },
    body: (
      <>
        <path className="m-b" d={BASE} />
        <ellipse className="m-b" cx="31" cy="72" rx="6.5" ry="9" />
        <ellipse className="m-b" cx="89" cy="72" rx="6.5" ry="9" />
        <rect className="m-b" x="35" y="32" width="50" height="69" rx="5" />
        <rect className="m-b" x="31" y="16" width="15" height="19" rx="3" />
        <rect className="m-b" x="52.5" y="16" width="15" height="19" rx="3" />
        <rect className="m-b" x="74" y="16" width="15" height="19" rx="3" />
        <rect className="m-s" x="29" y="30" width="62" height="9" rx="3.5" />
        <path className="m-mortar m-detail" d="M40 90 h13 M60 95 h15 M66 86 h12 M42 46 h9 M71 44 h8" />
      </>
    ),
  },
  nova: {
    anchors: {
      neck: { x: 60, y: 70, w: 40 },
      chest: { x: 60, y: 85 },
      head: { x: 60, y: 14, w: 26 },
      shoulders: { x1: 44, x2: 76, y: 70 },
    },
    face: { cx: 60, cy: 46, dx: 10, r: 4.4, mouth: 57, lashes: true },
    body: (
      <>
        <path className="m-b" d={BASE} />
        <path className="m-b" d="M37 100 Q42 78 50 70 L70 70 Q78 78 83 100 Z" />
        <ellipse className="m-s" cx="60" cy="70" rx="17" ry="5.5" />
        <circle className="m-b" cx="60" cy="45" r="25" />
        <path className="m-s" d="M36 37 Q33 13 52 13 Q57 1 68 9 Q80 5 84 20 Q88 31 84 38 Q76 26 64 27 Q60 21 54 27 Q44 26 36 37 Z" />
        <circle className="m-l m-detail" cx="52" cy="13" r="2.2" />
      </>
    ),
  },
  rufus: {
    anchors: {
      neck: { x: 60, y: 80, w: 36 },
      chest: { x: 60, y: 91 },
      head: { x: 60, y: 16, w: 26 },
      shoulders: { x1: 44, x2: 76, y: 80 },
    },
    face: { cx: 60, cy: 45, dx: 9.5, r: 4.2, mouth: 63 },
    body: (
      <>
        <path className="m-b" d={BASE} />
        <path className="m-b" d={pedestal(78)} />
        <g className="m-s">
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return <circle key={i} cx={(60 + Math.cos(a) * 26).toFixed(2)} cy={(48 + Math.sin(a) * 26).toFixed(2)} r="10" />;
          })}
        </g>
        <circle className="m-s m-flat" cx="60" cy="48" r="28" />
        <circle className="m-b" cx="42" cy="28" r="6.5" />
        <circle className="m-b" cx="78" cy="28" r="6.5" />
        <circle className="m-b" cx="60" cy="48" r="21" />
        <ellipse className="m-l" cx="60" cy="58" rx="11" ry="8" />
        <path className="m-ink" d="M56 53 L64 53 L60 57.5 Z" />
      </>
    ),
  },
};

function Eyes({ f, face }: { f: FaceSpec; face: Face }) {
  const xs = [f.cx - f.dx, f.cx + f.dx];
  if (face === 'happy') {
    return (
      <>
        {xs.map((x) => (
          <path key={x} className="m-arc" d={`M${x - f.r} ${f.cy + 1.5} Q${x} ${f.cy - f.r * 1.6} ${x + f.r} ${f.cy + 1.5}`} />
        ))}
      </>
    );
  }
  const lift = face === 'cheer' ? -1.2 : 0;
  return (
    <>
      {xs.map((x) => (
        <g key={x}>
          <ellipse className="m-ink m-pupil" cx={x} cy={f.cy + lift} rx={f.r} ry={f.r * 1.18} />
          <circle className="m-shine m-detail" cx={x + f.r * 0.35} cy={f.cy + lift - f.r * 0.45} r={f.r * 0.38} />
        </g>
      ))}
      {f.lashes
        ? xs.map((x, i) => (
            <path
              key={`l${x}`}
              className="m-arc m-detail"
              d={i ? `M${x + f.r - 0.5} ${f.cy - f.r * 0.5} l3.5 -1` : `M${x - f.r + 0.5} ${f.cy - f.r * 0.5} l-3.5 -1`}
            />
          ))
        : null}
    </>
  );
}

function Brows({ f, face }: { f: FaceSpec; face: Face }) {
  const y = f.cy - f.r * 2.1;
  const w = f.r * 1.3;
  const tilt = face === 'cheer' ? -1.6 : f.brows === 'brave' ? 1.1 : f.brows === 'calm' ? 0 : null;
  if (tilt === null) return null;
  return (
    <>
      <path className="m-arc" d={`M${f.cx - f.dx - w} ${y - tilt / 2} L${f.cx - f.dx + w} ${y + tilt / 2}`} />
      <path className="m-arc" d={`M${f.cx + f.dx - w} ${y + tilt / 2} L${f.cx + f.dx + w} ${y - tilt / 2}`} />
    </>
  );
}

function Mouth({ f, face }: { f: FaceSpec; face: Face }) {
  if (f.mouth === null) return null;
  const { cx: x } = f;
  const y = f.mouth;
  if (face === 'happy') return <path className="m-mouth" d={`M${x - 7} ${y - 1} Q${x} ${y + 11} ${x + 7} ${y - 1} Z`} />;
  if (face === 'cheer') return <path className="m-arc" d={`M${x - 5} ${y - 0.5} Q${x} ${y + 5} ${x + 5} ${y - 0.5}`} />;
  return <path className="m-arc" d={`M${x - 6} ${y - 1} Q${x} ${y + 5} ${x + 6} ${y - 1}`} />;
}

/** A four-point star; `plump` pulls the curves between the points outwards, so the arms are thick enough to show their fill under an outline. */
function star(cx: number, cy: number, s: number, plump = 0) {
  const k = s * plump;
  return `M${cx} ${cy - s} Q${cx + k} ${cy - k} ${cx + s} ${cy} Q${cx + k} ${cy + k} ${cx} ${cy + s} Q${cx - k} ${cy + k} ${cx - s} ${cy} Q${cx - k} ${cy - k} ${cx} ${cy - s} Z`;
}

function Cape({ a, stars }: { a: Anchors['shoulders']; stars: boolean }) {
  const { x1, x2, y } = a;
  return (
    <g className="m-cape-g">
      <path className="m-cape" d={`M${x1} ${y} Q${x1 - 16} ${y + 18} ${x1 - 19} 108 L${x2 + 19} 108 Q${x2 + 16} ${y + 18} ${x2} ${y} Z`} />
      {stars ? (
        <g className="m-cape-star">
          <path d={star(x1 - 13, 100, 3.6)} />
          <path d={star(x2 + 13, 100, 3.6)} />
          <path d={star(x1 - 8, y + 16, 2.8)} />
          <path d={star(x2 + 8, y + 16, 2.8)} />
        </g>
      ) : null}
    </g>
  );
}

function Scarf({ a }: { a: Anchors['neck'] }) {
  const { x, y, w } = a;
  const tail = x + w / 4;
  return (
    <g className="m-scarf-g">
      <path className="m-scarf" d={`M${tail - 3} ${y + 2} L${tail + 5} ${y + 19} L${tail - 4} ${y + 21} L${tail - 8} ${y + 3} Z`} />
      <rect className="m-scarf" x={x - w / 2} y={y - 5} width={w} height="10" rx="5" />
      <path className="m-scarf-stripe m-detail" d={`M${x - w / 4} ${y - 4} v8 M${x} ${y - 4} v8`} />
    </g>
  );
}

function Medal({ a, tier }: { a: Anchors['chest']; tier: MedalTier }) {
  const { x, y } = a;
  return (
    <g className="m-medal-g">
      <path className="m-ribbon" d={`M${x - 6} ${y - 11} L${x - 1.5} ${y - 1} L${x + 1.5} ${y - 1} L${x + 6} ${y - 11} Z`} />
      <circle className={`m-medal m-medal--${tier}`} cx={x} cy={y + 3} r="6.5" />
      <path className="m-medal-star m-detail" d={star(x, y + 3, 3)} />
    </g>
  );
}

function Crown({ a, jewel }: { a: Anchors['head']; jewel: boolean }) {
  const { x, y, w } = a;
  const h = w * 0.62;
  return (
    <g className="m-crown-g">
      <path
        className="m-crown"
        d={`M${x - w / 2} ${y} L${x - w / 2 - 1} ${y - h} L${x - w / 4} ${y - h * 0.45} L${x} ${y - h * 1.15} L${x + w / 4} ${y - h * 0.45} L${x + w / 2 + 1} ${y - h} L${x + w / 2} ${y} Z`}
      />
      {jewel ? <circle className="m-jewel" cx={x} cy={y - h * 0.32} r="3.3" /> : null}
    </g>
  );
}

function Laurel() {
  const leaves = (side: 1 | -1) =>
    Array.from({ length: 6 }, (_, i) => {
      const deg = 112 + i * 16;
      const a = (deg * Math.PI) / 180;
      const x = 60 + side * Math.cos(a) * 50;
      const y = 64 + Math.sin(a) * 48;
      const rot = side * (deg - 90 + 25);
      return (
        <ellipse
          key={`${side}${i}`}
          cx={x.toFixed(2)}
          cy={y.toFixed(2)}
          rx="4.2"
          ry="8"
          transform={`rotate(${rot} ${x.toFixed(2)} ${y.toFixed(2)})`}
        />
      );
    });
  return (
    <g className="m-laurel">
      {leaves(1)}
      {leaves(-1)}
    </g>
  );
}

function Sparkles() {
  return (
    <g className="m-spark">
      <path d={star(15, 30, 9, 0.22)} />
      <path d={star(104, 20, 10, 0.22)} />
      <path d={star(107, 44, 6.5, 0.22)} />
      <path d={star(12, 52, 5.5, 0.22)} />
    </g>
  );
}

const SMALL: MascotSize[] = ['xs', 'sm'];

export default function Mascot({
  id,
  stage = 0,
  look: given,
  size = 'md',
  face = 'idle',
  motion = null,
  shadow = false,
  label,
  className,
}: {
  id: MascotId;
  stage?: number;
  /** Overrides the look `stage` gives, for a drawing that shows one item. */
  look?: Look;
  size?: MascotSize;
  face?: Face;
  motion?: Motion;
  /** A dark silhouette: the look a learner hasn't reached yet. */
  shadow?: boolean;
  /** Spoken name; without one the drawing is decoration beside its own text. */
  label?: string;
  className?: string;
}) {
  const def = mascotById(id)!;
  const { anchors, face: f, body } = CAST[id];
  const look = given ?? lookAt(stage);
  const classes = [
    'mascot',
    `mascot--${id}`,
    `mascot--${size}`,
    SMALL.includes(size) ? 'mascot--small' : '',
    shadow ? 'mascot--shadow' : '',
    motion ? `mascot--${motion}` : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <svg
      viewBox="0 0 120 120"
      className={classes}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      data-mascot={def.id}
    >
      {look.glow ? (
        <g className="m-glow">
          <circle cx="60" cy="62" r="58" />
          <circle cx="60" cy="62" r="47" />
          <circle cx="60" cy="62" r="36" />
        </g>
      ) : null}
      {look.laurel ? <Laurel /> : null}
      <g className="mascot__fig">
        {look.cape ? <Cape a={anchors.shoulders} stars={look.capeStars} /> : null}
        {body}
        <g className="m-face">
          {face === 'happy' ? (
            <g className="m-blush m-detail">
              <ellipse cx={f.cx - f.dx - 5} cy={f.cy + 8} rx="4.5" ry="2.6" />
              <ellipse cx={f.cx + f.dx + 5} cy={f.cy + 8} rx="4.5" ry="2.6" />
            </g>
          ) : null}
          <Eyes f={f} face={face} />
          <Brows f={f} face={face} />
          <Mouth f={f} face={face} />
        </g>
        {look.scarf ? <Scarf a={anchors.neck} /> : null}
        {look.medal ? <Medal a={anchors.chest} tier={look.medal} /> : null}
        {look.crown ? <Crown a={anchors.head} jewel={look.jewel} /> : null}
      </g>
      {look.sparkles ? <Sparkles /> : null}
    </svg>
  );
}
