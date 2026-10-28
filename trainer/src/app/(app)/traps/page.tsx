import { redirect } from 'next/navigation';

/** Traps are a section of Learn now; old links land there. */
export default function TrapsPage() {
  redirect('/#traps');
}
