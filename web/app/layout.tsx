import type { Metadata, Viewport } from "next";
import { getCatalog } from "@/lib/content/load";
import Shell from "@/components/shell/Shell";

/* The cascade order is load-bearing, exactly as it was in build.py's STYLES
   list: tokens first, responsive last. The files are the old app's, unchanged —
   components keep the same class names so the port is 1:1. */
import "@/styles/tokens.css";
import "@/styles/base.css";
import "@/styles/controls.css";
import "@/styles/shell.css";
import "@/styles/page.css";
import "@/styles/board.css";
import "@/styles/notation.css";
import "@/styles/record.css";
import "@/styles/coach.css";
import "@/styles/eval.css";
import "@/styles/notes.css";
import "@/styles/deviation.css";
import "@/styles/study.css";
import "@/styles/strategy.css";
import "@/styles/demo.css";
import "@/styles/lesson.css";
import "@/styles/path.css";
import "@/styles/structures.css";
import "@/styles/primer.css";
import "@/styles/progress.css";
import "@/styles/responsive.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://chesslab.dev"),
  title: {
    default: "Opening Lab — the opening, explained move by move",
    template: "%s — Opening Lab",
  },
  description:
    "An interactive chess opening course. Every move comes with a reason, " +
    "every claim checked by an engine — step through a line, drill it, and " +
    "get an answer when your opponent deviates.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark light",
};

/* Runs in <head>, ahead of the stylesheets, so the page paints in the chosen
   theme once instead of flashing the default — theme.js's job, on this app's
   own storage key. */
const THEME_SCRIPT = `(function(){
  var set=function(n){document.documentElement.setAttribute("data-theme",n==="light"?"light":"dark")};
  var stored=null;
  try{var saved=JSON.parse(window.localStorage.getItem("chesslab")||"null");
      stored=saved&&saved.ui&&saved.ui.theme}catch(e){}
  if(stored==="light"||stored==="dark"){set(stored);return}
  try{if(window.matchMedia("(prefers-color-scheme: light)").matches){set("light");return}}catch(e){}
  set("dark");
})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const catalog = getCatalog();
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <a className="skip" href="#main">Skip to the board</a>
        <Shell sections={catalog.sections} openings={catalog.openings}>
          {children}
        </Shell>
        {/* Outside the page content on purpose: a live region the router swaps
            out does not reliably announce. */}
        <div className="sr" id="announce" role="status" aria-live="polite"></div>
      </body>
    </html>
  );
}
