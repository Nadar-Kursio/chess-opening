import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="empty-state">
      <h1>That square is empty</h1>
      <p className="muted">There’s nothing at this address.</p>
      <Link className="btn btn--primary" href="/">
        Back to your openings
      </Link>
    </main>
  );
}
