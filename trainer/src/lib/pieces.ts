/* The pieces are SVG, and at one device pixel per CSS pixel the browser's exact-coverage
   antialiasing leaves their heavy outlines stair-stepped. Below 2x a board draws pre-rendered PNGs
   (public/pieces/<size>/, `npm run pieces`) instead, chosen 10-33% larger than they are drawn:
   the browser's bilinear shrink over that range is what smooths the edges. Drawn at its own size
   a PNG looks like the SVG, and from 2x smaller Chrome shrinks it through mipmaps, which can come
   out more jagged than the SVG, so one large PNG for every board would not do. */

/** A quarter octave apart, so one is always within 21% above what a board asks for. */
export const PIECE_SIZES = [16, 19, 23, 27, 32, 38, 45, 54, 64, 76, 91, 108, 128, 152];

const OVERSIZE = 1.1;

/** The PNG size for a piece drawn `cssPx` wide on a `dpr` screen, or null for the SVG. */
export function pieceRaster(cssPx: number, dpr: number): number | null {
  if (dpr >= 2) return null;
  const want = cssPx * dpr * OVERSIZE;
  const size = PIECE_SIZES.find((s) => s >= want);
  return size && size <= want * 1.25 ? size : null;
}

/** A FEN board character as the image name: 'N' is 'wN', 'p' is 'bP'. */
export function pieceCode(ch: string) {
  return (ch === ch.toUpperCase() ? 'w' : 'b') + ch.toUpperCase();
}

export function pieceUrl(code: string, raster: number | null) {
  return raster ? `/pieces/${raster}/${code}.png` : `/pieces/${code}.svg`;
}
