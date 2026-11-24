'use client';

import { useEffect, useState, type RefObject } from 'react';
import { pieceRaster } from '@/lib/pieces';

/** The PNG size (null: the SVG) for pieces drawn `share` of the element's width. */
export function usePieceRaster(ref: RefObject<HTMLElement | null>, share: number) {
  const [raster, setRaster] = useState<number | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setRaster(pieceRaster(el.getBoundingClientRect().width * share, window.devicePixelRatio));
    // Moving the window to a screen with another pixel ratio resizes nothing in CSS pixels.
    let screen = matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    const onScreen = () => {
      screen.removeEventListener('change', onScreen);
      screen = matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      screen.addEventListener('change', onScreen);
      measure();
    };
    screen.addEventListener('change', onScreen);
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => {
      observer.disconnect();
      screen.removeEventListener('change', onScreen);
    };
  }, [ref, share]);
  return raster;
}
