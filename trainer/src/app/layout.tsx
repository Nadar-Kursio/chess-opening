import type { Metadata, Viewport } from 'next';
import { Fredoka, Nunito } from 'next/font/google';
import './tokens.css';
import './globals.css';

const fredoka = Fredoka({ subsets: ['latin'], variable: '--font-fredoka', weight: ['500', '600', '700'] });
const nunito = Nunito({ subsets: ['latin'], variable: '--font-nunito', weight: ['400', '600', '700', '800'] });

export const metadata: Metadata = {
  title: { default: 'ChessLab', template: '%s · ChessLab' },
  description: 'Learn your openings move by move: lessons, drills, quizzes and free practice.',
  robots: { index: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f3f5f9' },
    { media: '(prefers-color-scheme: dark)', color: '#0f1420' },
  ],
};

// The learner's timezone, for streaks and the daily goal: read server-side from this cookie.
const TZ_COOKIE = `try{document.cookie='tz='+encodeURIComponent(Intl.DateTimeFormat().resolvedOptions().timeZone)+';path=/;max-age=31536000;samesite=lax'}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fredoka.variable} ${nunito.variable}`}>
      <body>
        <script dangerouslySetInnerHTML={{ __html: TZ_COOKIE }} />
        {children}
      </body>
    </html>
  );
}
