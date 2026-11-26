'use client';

/* The level-up card as a square PNG to share or keep. The mascot's colours live in CSS classes,
   which an SVG drawn into a canvas can't see, so each part's computed paint is written onto a copy
   first. Colours and the image's size come from tokens.css. */

const PAINT = ['fill', 'stroke', 'stroke-width', 'opacity', 'stroke-linecap', 'stroke-linejoin'] as const;

function standalone(svg: SVGSVGElement, px: number) {
  const copy = svg.cloneNode(true) as SVGSVGElement;
  const from = [svg, ...svg.querySelectorAll('*')];
  const to = [copy, ...copy.querySelectorAll('*')];
  from.forEach((el, i) => {
    const cs = getComputedStyle(el);
    const out = to[i] as SVGElement;
    out.removeAttribute('class');
    if (cs.display === 'none') {
      out.setAttribute('display', 'none');
      return;
    }
    for (const p of PAINT) out.setAttribute(p, cs.getPropertyValue(p));
  });
  copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  copy.setAttribute('width', String(px));
  copy.setAttribute('height', String(px));
  return new XMLSerializer().serializeToString(copy);
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function levelCardPng(
  svg: SVGSVGElement,
  text: { eyebrow: string; title: string; line: string; brand: string },
  fonts: { display: string; body: string },
) {
  const root = getComputedStyle(document.documentElement);
  const token = (name: string) => root.getPropertyValue(name).trim();
  const S = parseFloat(token('--mascot-share'));
  const canvas = document.createElement('canvas');
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = token('--surface');
  ctx.fillRect(0, 0, S, S);
  ctx.strokeStyle = token('--purple');
  ctx.lineWidth = S * 0.014;
  ctx.beginPath();
  ctx.roundRect(S * 0.04, S * 0.04, S * 0.92, S * 0.92, S * 0.06);
  ctx.stroke();

  ctx.fillStyle = token('--purple-soft');
  ctx.beginPath();
  ctx.arc(S / 2, S * 0.36, S * 0.22, 0, Math.PI * 2);
  ctx.fill();

  const art = S * 0.44;
  const url = URL.createObjectURL(new Blob([standalone(svg, art)], { type: 'image/svg+xml' }));
  try {
    ctx.drawImage(await loadImage(url), (S - art) / 2, S * 0.13, art, art);
  } finally {
    URL.revokeObjectURL(url);
  }

  ctx.textAlign = 'center';
  const write = (s: string, y: number, size: number, colour: string, font: string, weight: number) => {
    let px = size;
    ctx.font = `${weight} ${px}px ${font}`;
    while (ctx.measureText(s).width > S * 0.82 && px > size * 0.6) {
      px *= 0.94;
      ctx.font = `${weight} ${px}px ${font}`;
    }
    ctx.fillStyle = colour;
    ctx.fillText(s, S / 2, y);
  };
  write(text.eyebrow.toUpperCase(), S * 0.665, S * 0.036, token('--purple'), fonts.body, 800);
  write(text.title, S * 0.76, S * 0.082, token('--ink'), fonts.display, 700);
  write(text.line, S * 0.835, S * 0.04, token('--ink-soft'), fonts.display, 600);
  write(text.brand, S * 0.915, S * 0.03, token('--muted'), fonts.body, 700);

  return new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No image'))), 'image/png'));
}

/** Opens the system share sheet where there is one, and downloads the image everywhere else. */
export async function shareOrSave(png: Blob, name: string, title: string) {
  const file = new File([png], name, { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return 'shared';
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'cancelled';
    }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(png);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 0);
  return 'saved';
}
