/* Announce to assistive tech, via the #announce live region layout.tsx owns.
   The single place that guarantees every piece of feedback has a non-visual
   form — reduced-motion users lose the animations, never the message. */
export function announce(msg: string): void {
  const el = document.getElementById("announce");
  if (!el) return;
  el.textContent = "";
  setTimeout(() => { el.textContent = msg; }, 30);
}
