import type { Graded } from './cards';
import type { GradeSave, Save, SessionSave } from './saves';

/* A finished session must survive a bad connection, a deploy or a closed tab. So every save is
   written to this browser first and only removed once the server has it. Sending tries a few
   times; what still fails stays here, per account, until OutboxSync sends it again. */

export type SaveState<R> = { status: 'saved'; result: R } | { status: 'queued' } | { status: 'rejected' };
type Outcome = { status: 'saved'; result: unknown } | { status: 'rejected' } | { status: 'kept' };
type OnState = (state: SaveState<unknown>) => void;

export const QUEUED_NOTE = 'Kept on this device until it can sync.';

const RETRY_MS = [1000, 3000];
const TIMEOUT_MS = 8000;

let owner = '';
let memory: Save[] = [];
let storageWorks = true;
let sessionsSaved = 0;
let flushing: Promise<void> | null = null;
const delivering = new Set<string>();
const onStates = new Map<string, OnState>();
const listeners = new Set<() => void>();

const storageKey = () => `chesslab:unsaved:${owner}`;

function read(): Save[] {
  if (!storageWorks) return memory;
  try {
    return JSON.parse(localStorage.getItem(storageKey()) ?? '[]') as Save[];
  } catch {
    return memory;
  }
}

function write(saves: Save[]) {
  memory = saves;
  try {
    localStorage.setItem(storageKey(), JSON.stringify(saves));
    storageWorks = true;
  } catch {
    storageWorks = false;
  }
  notify();
}

function notify() {
  for (const listener of listeners) listener();
}

async function post(save: Save): Promise<Outcome> {
  try {
    const response = await fetch('/api/saves', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(save),
      // Without a session the proxy redirects to sign-in, which would read as a success.
      redirect: 'manual',
      keepalive: true,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (response.ok) return { status: 'saved', result: await response.json() };
    return response.status === 400 ? { status: 'rejected' } : { status: 'kept' };
  } catch {
    return { status: 'kept' };
  }
}

function settle(save: Save, outcome: Exclude<Outcome, { status: 'kept' }>) {
  write(read().filter((s) => s.id !== save.id));
  if (outcome.status === 'saved' && save.kind === 'session') sessionsSaved++;
  onStates.get(save.id)?.(outcome);
  onStates.delete(save.id);
  notify();
}

async function deliver(save: Save) {
  let outcome = await post(save);
  for (const wait of RETRY_MS) {
    if (outcome.status !== 'kept' || navigator.onLine === false) break;
    await new Promise((resolve) => setTimeout(resolve, wait));
    outcome = await post(save);
  }
  delivering.delete(save.id);
  if (outcome.status === 'kept') {
    onStates.get(save.id)?.({ status: 'queued' });
    notify();
  } else {
    settle(save, outcome);
  }
}

function send(payload: { kind: 'session'; session: SessionSave } | { kind: 'grade'; grade: GradeSave }, onState?: OnState) {
  const save: Save = { ...payload, id: crypto.randomUUID(), at: Date.now() };
  if (onState) onStates.set(save.id, onState);
  delivering.add(save.id);
  write([...read(), save]);
  void deliver(save);
}

export function saveSession(session: SessionSave, onState?: (state: SaveState<{ passed: boolean }>) => void) {
  send({ kind: 'session', session }, onState as OnState | undefined);
}

export function saveGrade(grade: GradeSave, onState?: (state: SaveState<{ graded: Graded | null }>) => void) {
  send({ kind: 'grade', grade }, onState as OnState | undefined);
}

async function sendWaiting() {
  for (const save of read()) {
    if (delivering.has(save.id)) continue;
    const outcome = await post(save);
    if (outcome.status === 'kept') break;
    settle(save, outcome);
  }
}

/** Sends what's waiting, oldest first, and stops at the first failure until the next attempt. */
export function flushOutbox() {
  flushing ??= sendWaiting().finally(() => {
    flushing = null;
  });
  return flushing;
}

/** Whose saves these are: a shared browser must never send one learner's run as another's. */
export function setOutboxOwner(userId: string) {
  if (userId === owner) return;
  owner = userId;
  memory = [];
  notify();
}

export function subscribeOutbox(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Saves that failed and are waiting; one still being sent for the first time doesn't count. */
export const waitingSaves = () => read().filter((s) => !delivering.has(s.id)).length;
export const savedSessions = () => sessionsSaved;
