import { mkdir, readFile, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { PIECE_SIZES } from '../src/lib/pieces';

/* Renders public/pieces/<size>/*.png from the SVGs beside them, for screens below 2x
   (src/lib/pieces.ts says why). Each is drawn eight times larger and shrunk with a Mitchell
   filter. Run it after changing a piece SVG or PIECE_SIZES, and commit what it writes. */

const DIR = path.join(process.cwd(), 'public', 'pieces');
const SUPERSAMPLE = 8;

async function main() {
  const entries = await readdir(DIR, { withFileTypes: true });
  for (const e of entries) {
    if (e.isDirectory() && /^\d+$/.test(e.name)) await rm(path.join(DIR, e.name), { recursive: true });
  }
  const svgs = entries.filter((e) => e.isFile() && e.name.endsWith('.svg')).map((e) => e.name);

  let bytes = 0;
  for (const size of PIECE_SIZES) {
    await mkdir(path.join(DIR, String(size)));
    for (const name of svgs) {
      const svg = await readFile(path.join(DIR, name));
      const { width = 0 } = await sharp(svg).metadata();
      const big = size * SUPERSAMPLE;
      const master = await sharp(svg, { density: (72 * big) / width }).resize(big, big).png().toBuffer();
      const out = await sharp(master)
        .resize(size, size, { kernel: 'mitchell' })
        .toColourspace('b-w')
        .png({ compressionLevel: 9, adaptiveFiltering: true })
        .toFile(path.join(DIR, String(size), name.replace(/\.svg$/, '.png')));
      bytes += out.size;
    }
  }
  console.log(`Wrote ${PIECE_SIZES.length * svgs.length} PNGs, ${Math.round(bytes / 1024)} KB.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
