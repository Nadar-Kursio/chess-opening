import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { flushOutbox, saveSession, setOutboxOwner, waitingSaves, type SaveState } from '../src/lib/outbox.ts';

type Reply = { ok?: boolean; status?: number; type?: string; json?: () => Promise<unknown> } | 'network-down';

const session = {
  openingId: 'london',
  lineSlug: 'main',
  mode: 'drill' as const,
  correct: 10,
  wrong: 4,
  hints: 0,
  score: null,
  positions: [],
};
const OK: Reply = { ok: true, status: 200, json: async () => ({ passed: true }) };

let replies: Reply[];
let posted: { id: string; at: number }[];
let owners = 0;

function fakeStorage() {
  const items = new Map<string, string>();
  return { getItem: (k: string) => items.get(k) ?? null, setItem: (k: string, v: string) => void items.set(k, v) };
}

beforeEach(() => {
  replies = [];
  posted = [];
  Object.defineProperty(globalThis, 'localStorage', { value: fakeStorage(), configurable: true });
  // Retries wait in real time otherwise.
  Object.defineProperty(globalThis, 'setTimeout', {
    value: (fn: () => void) => setImmediate(fn),
    configurable: true,
  });
  globalThis.fetch = (async (_url: string, init: RequestInit) => {
    posted.push(JSON.parse(init.body as string));
    const reply = replies.shift() ?? 'network-down';
    if (reply === 'network-down') throw new TypeError('Failed to fetch');
    return { ok: false, status: 500, type: 'basic', ...reply };
  }) as typeof fetch;
  setOutboxOwner(`learner-${++owners}`);
});

function save() {
  return new Promise<SaveState<{ passed: boolean }>>((resolve) => saveSession(session, resolve));
}

test('a save the server takes first time leaves nothing behind', async () => {
  replies = [OK];
  assert.deepEqual(await save(), { status: 'saved', result: { passed: true } });
  assert.equal(posted.length, 1);
  assert.equal(waitingSaves(), 0);
});

test('a failed post is retried under the same id, so the server can recognise a repeat', async () => {
  replies = ['network-down', { status: 502 }, OK];
  assert.equal((await save()).status, 'saved');
  assert.equal(posted.length, 3);
  assert.equal(new Set(posted.map((p) => p.id)).size, 1);
  assert.equal(waitingSaves(), 0);
});

test('after three failures the run waits on this device and a later flush delivers it', async () => {
  const states: string[] = [];
  const queued = new Promise<void>((resolve) =>
    saveSession(session, (state) => {
      states.push(state.status);
      if (state.status === 'queued') resolve();
    }),
  );
  await queued;
  assert.equal(posted.length, 3);
  assert.equal(waitingSaves(), 1);

  replies = [OK];
  await flushOutbox();
  assert.deepEqual(states, ['queued', 'saved']);
  assert.equal(waitingSaves(), 0);
  assert.equal(new Set(posted.map((p) => p.id)).size, 1);
});

test('a flush keeps the original play time', async () => {
  await new Promise<void>((resolve) =>
    saveSession(session, (state) => {
      if (state.status === 'queued') resolve();
    }),
  );
  const { at } = posted[0];
  posted = [];
  replies = [OK];
  await flushOutbox();
  assert.equal(posted[0].at, at);
});

test('flushing an empty outbox does not block the next flush', async () => {
  await flushOutbox();
  await new Promise<void>((resolve) =>
    saveSession(session, (state) => {
      if (state.status === 'queued') resolve();
    }),
  );
  replies = [OK];
  await flushOutbox();
  assert.equal(waitingSaves(), 0);
});

test('a save the server rejects is dropped, not retried for ever', async () => {
  replies = [{ status: 400 }];
  assert.deepEqual(await save(), { status: 'rejected' });
  assert.equal(posted.length, 1);
  assert.equal(waitingSaves(), 0);
});

test('a signed-out learner keeps the run: the proxy\'s redirect is not read as saved', async () => {
  replies = [{ status: 0, type: 'opaqueredirect' }, { status: 0, type: 'opaqueredirect' }, { status: 0, type: 'opaqueredirect' }];
  assert.equal((await save()).status, 'queued');
  assert.equal(waitingSaves(), 1);
});

test('a flush stops at the first failure and keeps the rest in order', async () => {
  for (let i = 0; i < 2; i++) {
    await new Promise<void>((resolve) =>
      saveSession(session, (state) => {
        if (state.status === 'queued') resolve();
      }),
    );
  }
  assert.equal(waitingSaves(), 2);
  const [first] = posted;
  posted = [];
  replies = ['network-down'];
  await flushOutbox();
  assert.equal(posted.length, 1);
  assert.equal(posted[0].id, first.id);
  assert.equal(waitingSaves(), 2);
});

test('one learner\'s waiting saves are never sent as another\'s', async () => {
  await new Promise<void>((resolve) =>
    saveSession(session, (state) => {
      if (state.status === 'queued') resolve();
    }),
  );
  const first = `learner-${owners}`;
  setOutboxOwner('someone-else');
  assert.equal(waitingSaves(), 0);
  posted = [];
  await flushOutbox();
  assert.equal(posted.length, 0);
  setOutboxOwner(first);
  assert.equal(waitingSaves(), 1);
});
